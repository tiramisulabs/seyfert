import type {
	ComponentCallback,
	ComponentOnErrorCallback,
	ComponentRefreshCallback,
	ComponentStopCallback,
	ListenerOptions,
	ModalSubmitCallback,
} from '../builders/types';
import { runContextScopes } from '../client/plugins';
import { LimitedCollection } from '../collection';
import { BaseCommand, type ResolvedRegisteredMiddlewares, type UsingClient } from '../commands';
import type { FileLoaded } from '../commands/handler';
import {
	BaseHandler,
	isCloudflareWorker,
	type Logger,
	magicImport,
	type OnFailCallback,
	SeyfertError,
} from '../common';
import type { ComponentInteraction, ModalSubmitInteraction, StringSelectMenuInteraction } from '../structures';
import { ComponentCommand, InteractionCommandType } from './componentcommand';
import type { ComponentContext } from './componentcontext';
import { matchesCustomId } from './customId';
import { ModalCommand } from './modalcommand';
import type { ModalContext } from './modalcontext';

type PluginComponentLoadOptionsProvider = {
	createPluginComponentLoadOptions?: () => ComponentLoadOptions;
};
type ComponentSetTransformer = (component: ComponentCommands) => ComponentCommands | false | void;

type UserMatches = string | string[] | RegExp;
type RegisteredModalCallback = {
	callback: ModalSubmitCallback;
	close?: () => void;
	registered: ModalSubmitCallback;
	userId: string;
};
type COMPONENTS = {
	components: { match: MatchCallback; callback: ComponentCallback; close?: () => void }[];
	options?: ListenerOptions;
	messageId: string;
	channelId: string;
	guildId: string | undefined;
	idle?: NodeJS.Timeout;
	timeout?: NodeJS.Timeout;
	onError?: ComponentOnErrorCallback;
	__run: (customId: UserMatches, callback: ComponentCallback) => any;
};

class ModalCallbackCollection extends LimitedCollection<string, ModalSubmitCallback> {
	private internalMutation = false;

	constructor(
		private readonly onExternalSet: (userId: string, callback: ModalSubmitCallback, customExpire?: number) => void,
		private readonly onExternalDelete: (userId: string) => void,
		private readonly onExternalClear: () => void,
	) {
		super({
			expire: 60e3 * 10,
			onDelete: userId => {
				if (!this.internalMutation) this.onExternalDelete(userId);
			},
		});
	}

	override set(userId: string, callback: ModalSubmitCallback, customExpire?: number) {
		if (!this.internalMutation) this.onExternalSet(userId, callback, customExpire);
		return super.set(userId, callback, customExpire);
	}

	override clear() {
		const notify = !this.internalMutation;
		super.clear();
		if (notify) this.onExternalClear();
	}

	setManaged(userId: string, callback: ModalSubmitCallback) {
		this.internalMutation = true;
		try {
			this.set(userId, callback);
		} finally {
			this.internalMutation = false;
		}
	}

	deleteManaged(userId: string) {
		this.internalMutation = true;
		try {
			return this.delete(userId);
		} finally {
			this.internalMutation = false;
		}
	}
}

export type MatchCallback = (str: string) => boolean;
export type CollectorInteraction = ComponentInteraction | StringSelectMenuInteraction;
export type ComponentCommands = ComponentCommand | ModalCommand;
export interface CreateComponentCollectorResult {
	run<T extends CollectorInteraction = CollectorInteraction>(
		customId: UserMatches,
		callback: ComponentCallback<T>,
	): void;
	stop(reason?: string): void;
	waitFor<T extends CollectorInteraction = CollectorInteraction>(
		customId: UserMatches,
		timeout?: number,
	): Promise<T | null>;
	resetTimeouts(): void;
}

export class ComponentHandler extends BaseHandler {
	onFail: OnFailCallback = err => this.logger.warn('<Client>.components.onFail', err);
	readonly values = new Map<string, COMPONENTS>();
	// 10 minutes of timeout by default, because discord doesnt send an event when the user cancels the modal
	private readonly modalCallbacks = new LimitedCollection<string, RegisteredModalCallback>({ expire: 60e3 * 10 });
	private readonly modalRegistry = new ModalCallbackCollection(
		(userId, callback, customExpire) => this.setExternalModalCallback(userId, callback, customExpire),
		userId => this.deleteModalCallbacksForUser(userId),
		() => this.clearModalCallbacks(),
	);
	readonly modals: LimitedCollection<string, ModalSubmitCallback> = this.modalRegistry;
	readonly commands: ComponentCommands[] = [];
	filter = (path: string) => path.endsWith('.js') || (!path.endsWith('.d.ts') && path.endsWith('.ts'));

	constructor(
		logger: Logger,
		protected client: UsingClient,
	) {
		super(logger);
	}

	private createMatchCallback(match: UserMatches): MatchCallback {
		if (Array.isArray(match)) return str => match.includes(str);
		return str => matchesCustomId(match, str);
	}

	createComponentCollector(
		messageId: string,
		channelId: string,
		guildId: string | undefined,
		options: ListenerOptions = {},
		components: COMPONENTS['components'] = [],
	): CreateComponentCollectorResult {
		this.values.set(messageId, {
			messageId,
			channelId,
			guildId,
			options,
			components,
			idle:
				options.idle && options.idle > 0
					? setTimeout(() => {
							const old = this.clearValue(messageId);
							if (!old) return;
							options.onStop?.('idle', () => {
								this.createComponentCollector(messageId, channelId, guildId, options, old.components);
							});
						}, options.idle)
					: undefined,
			timeout:
				options.timeout && options.timeout > 0
					? setTimeout(() => {
							const old = this.clearValue(messageId);
							if (!old) return;
							options.onStop?.('timeout', () => {
								this.createComponentCollector(messageId, channelId, guildId, options, old.components);
							});
						}, options.timeout)
					: undefined,
			__run: (customId, callback) => {
				if (this.values.has(messageId)) {
					this.values.get(messageId)!.components.push({
						callback,
						match: this.createMatchCallback(customId),
					});
				}
			},
			onError: options.onError,
		});
		const collector = this.values.get(messageId)!;

		return {
			run: collector.__run as CreateComponentCollectorResult['run'],
			stop: (reason?: string) => {
				const old = this.clearValue(messageId);
				if (!old) return;
				options.onStop?.(reason, () => {
					this.createComponentCollector(messageId, channelId, guildId, options, old.components);
				});
			},
			waitFor: <T extends CollectorInteraction = CollectorInteraction>(customId: UserMatches, timeout?: number) =>
				new Promise<T | null>(resolve => {
					const collector = this.values.get(messageId);
					if (!collector) return resolve(null);

					let nodeTimeout: NodeJS.Timeout | undefined;
					let cleaned = false;
					const component: COMPONENTS['components'][number] = {
						callback: interaction => settle(interaction as T),
						close: () => settle(null),
						match: this.createMatchCallback(customId),
					};
					const cleanup = () => {
						if (cleaned) return;
						cleaned = true;
						clearTimeout(nodeTimeout);

						const index = collector.components.indexOf(component);
						if (index !== -1) collector.components.splice(index, 1);
					};
					const settle = (interaction: T | null) => {
						if (cleaned) return;
						cleanup();
						resolve(interaction);
					};

					collector.components.push(component);

					if (timeout && timeout > 0)
						nodeTimeout = setTimeout(() => {
							settle(null);
						}, timeout);
				}),
			resetTimeouts: () => {
				this.resetTimeouts(messageId);
			},
		};
	}

	async onComponent(id: string, interaction: ComponentInteraction) {
		const row = this.values.get(id)!;
		const component = row?.components?.find(x => x.match(interaction.customId));
		if (!component) return;
		if (row.options?.filter) {
			if (!(await row.options.filter(interaction))) return row.options.onPass?.(interaction);
		}
		row.idle?.refresh();

		const stop: ComponentStopCallback = reason => {
			this.clearValue(id);
			row.options?.onStop?.(reason ?? 'stop', () => {
				this.createComponentCollector(row.messageId, row.channelId, row.guildId, row.options, row.components);
			});
		};

		const refresh: ComponentRefreshCallback = () => {
			this.resetTimeouts(id);
		};

		try {
			await component.callback(interaction, stop, refresh);
		} catch (err) {
			try {
				if (row.onError) {
					await row.onError(interaction, err, stop, refresh);
				} else {
					this.client.logger.error('<Client>.components.onComponent', err);
				}
			} catch (err) {
				this.client.logger.error('<Client>.components.onComponent', err);
			}
		}
	}

	hasComponent(id: string, customId: string) {
		return this.values.get(id)?.components?.some(x => x.match(customId));
	}

	resetTimeouts(id: string) {
		const listener = this.values.get(id);
		if (listener) {
			listener.timeout?.refresh();
			listener.idle?.refresh();
		}
	}

	hasModal(interaction: ModalSubmitInteraction) {
		if (this.modalCallbacks.has(this.modalKey(interaction.user.id, interaction.customId))) return true;
		const callback = this.modals.get(interaction.user.id);
		const managed = callback ? this.findManagedModalCallback(callback) : undefined;
		return !!callback && managed?.userId !== interaction.user.id;
	}

	onModalSubmit(interaction: ModalSubmitInteraction) {
		const callback = this.modalCallbacks.get(this.modalKey(interaction.user.id, interaction.customId));
		if (callback) return callback.registered(interaction);
		const legacyCallback = this.modals.get(interaction.user.id);
		if (!legacyCallback) return;
		const managed = this.findManagedModalCallback(legacyCallback);
		if (managed?.userId === interaction.user.id) return;
		this.modals.delete(interaction.user.id);
		return (managed?.callback ?? legacyCallback)(interaction);
	}

	registerModal(userId: string, customId: string, callback?: ModalSubmitCallback, close?: () => void) {
		const key = this.modalKey(userId, customId);
		const previous = this.modalCallbacks.get(key);
		if (previous) {
			this.deleteModalCallback(userId, customId, previous.registered);
			previous.close?.();
		}
		if (!callback) return;
		const registeredCallback: ModalSubmitCallback = interaction => {
			this.deleteModalCallback(userId, customId, registeredCallback);
			return callback(interaction);
		};
		this.modalCallbacks.set(key, { callback, close, registered: registeredCallback, userId });
		this.modalRegistry.setManaged(userId, registeredCallback);
	}

	deleteModalCallback(userId: string, customId: string, expected?: ModalSubmitCallback) {
		const key = this.modalKey(userId, customId);
		const entry = this.modalCallbacks.get(key);
		if (expected && entry?.callback !== expected && entry?.registered !== expected) return;
		this.modalCallbacks.delete(key);
		if (entry && this.modals.get(userId) === entry.registered) {
			this.modalRegistry.deleteManaged(userId);
			this.promoteModalCallback(userId);
		}
	}

	private modalKey(userId: string, customId: string) {
		return `${userId}:${customId}`;
	}

	private deleteModalCallbacksForUser(userId: string) {
		for (const [key, entry] of [...this.modalCallbacks]) {
			if (entry.userId !== userId) continue;
			this.modalCallbacks.delete(key);
			entry.close?.();
		}
	}

	private setExternalModalCallback(userId: string, callback: ModalSubmitCallback, customExpire?: number) {
		const managed = [...this.modalCallbacks].find(([, registered]) => registered.registered === callback);
		if (managed?.[1].userId === userId) {
			this.modalCallbacks.set(managed[0], managed[1], customExpire);
			return;
		}
		this.deleteModalCallbacksForUser(userId);
	}

	private findManagedModalCallback(callback: ModalSubmitCallback) {
		return [...this.modalCallbacks.values()].find(registered => registered.registered === callback);
	}

	private clearModalCallbacks() {
		const entries = [...this.modalCallbacks.values()];
		this.modalCallbacks.clear();
		for (const entry of entries) entry.close?.();
	}

	private promoteModalCallback(userId: string) {
		for (const entry of [...this.modalCallbacks.values()].reverse()) {
			if (entry.userId !== userId) continue;
			this.modalRegistry.setManaged(userId, entry.registered);
			break;
		}
	}

	deleteValue(id: string, reason?: string) {
		const component = this.clearValue(id);
		if (!component) return;
		component.options?.onStop?.(reason, () => {
			this.createComponentCollector(
				component.messageId,
				component.channelId,
				component.guildId,
				component.options,
				component.components,
			);
		});
	}

	clearValue(id: string) {
		const component = this.values.get(id);
		if (!component) return;
		clearTimeout(component.timeout);
		clearTimeout(component.idle);
		this.values.delete(id);
		for (const entry of [...component.components]) entry.close?.();
		return component;
	}

	establishDefaults(component: ComponentCommands) {
		component.props ??= this.client.options.commands?.defaults?.props ?? {};
		const is = component instanceof ModalCommand ? 'modals' : 'components';
		component.onInternalError ??= this.client.options?.[is]?.defaults?.onInternalError;
		component.onMiddlewaresError ??= this.client.options?.[is]?.defaults?.onMiddlewaresError;
		component.onRunError ??= this.client.options?.[is]?.defaults?.onRunError;
		component.onAfterRun ??= this.client.options?.[is]?.defaults?.onAfterRun;
		component.onBeforeMiddlewares ??= this.client.options?.[is]?.defaults?.onBeforeMiddlewares;
	}

	private normalizeLoadOptions(options?: ComponentSetTransformer | ComponentLoadOptions): ComponentLoadOptions {
		return typeof options === 'function' ? { transform: (_kind, component) => options(component) } : (options ?? {});
	}

	private materializeComponent(value: SeteableComponentCommand, options: ComponentLoadOptions = {}, filePath?: string) {
		let component: ReturnType<typeof this.callback>;
		component = this.callback(value, options.create);
		if (!component) return false;
		if (!(component instanceof ModalCommand || component instanceof ComponentCommand)) return false;
		this.establishDefaults(component);
		if (filePath) component.__filePath = filePath;
		const kind = component instanceof ModalCommand ? 'modal' : 'component';
		const wrapped = options.transform?.(kind, component) ?? component;
		if (!wrapped) return false;
		if (wrapped !== component) {
			component = wrapped;
			component.__filePath ??= filePath;
			this.establishDefaults(component);
		}
		return component;
	}

	set(instances: SeteableComponentCommand[], optionsOrTransform?: ComponentSetTransformer | ComponentLoadOptions) {
		const options = this.normalizeLoadOptions(optionsOrTransform);
		const added: ComponentCommands[] = [];
		for (const i of instances) {
			let component: ReturnType<typeof this.callback>;
			try {
				component = this.materializeComponent(i, options);
				if (!component) continue;
			} catch (e) {
				this.logger.warn(e, i);
				continue;
			}
			this.commands.push(component);
			added.push(component);
		}
		return added;
	}

	async load(componentsDir: string, options: ComponentLoadOptions = {}) {
		const paths = await this.loadFilesK<FileLoaded<HandleableComponentCommand>>(await this.getFiles(componentsDir));

		for (const { components, file } of paths.map(x => ({ components: this.onFile(x.file), file: x }))) {
			if (!components) continue;
			for (const value of components) {
				let component: ReturnType<typeof this.callback>;
				try {
					component = this.callback(value, options.create);
					if (!component) continue;
				} catch (e) {
					if (e instanceof Error && e.message.includes('is not a constructor')) {
						this.logger.warn(
							`${file.path
								.split(process.cwd())
								.slice(1)
								.join(process.cwd())} doesn't export the class by \`export default <ComponentCommand>\``,
						);
					} else this.logger.warn(e, value);
					continue;
				}
				if (!(component instanceof ModalCommand || component instanceof ComponentCommand)) continue;
				this.establishDefaults(component);
				component.__filePath = file.path;
				const kind = component instanceof ModalCommand ? 'modal' : 'component';
				const wrapped = options.transform?.(kind, component) ?? component;
				if (!wrapped) continue;
				if (wrapped !== component) {
					component = wrapped;
					component.__filePath ??= file.path;
					this.establishDefaults(component);
				}
				this.commands.push(component);
			}
		}
	}

	async reload(path: string) {
		if (!this.client.components) return;
		if (isCloudflareWorker()) {
			throw new SeyfertError('RELOAD_NOT_SUPPORTED', {
				metadata: { detail: 'Reload in Cloudflare worker is not supported' },
			});
		}
		const component = this.client.components.commands.find(
			x =>
				x.__filePath?.endsWith(`${path}.js`) ||
				x.__filePath?.endsWith(`${path}.ts`) ||
				x.__filePath?.endsWith(path) ||
				x.__filePath === path,
		);
		if (!component?.__filePath) return null;
		delete require.cache[component.__filePath];
		const index = this.client.components.commands.findIndex(x => x.__filePath === component.__filePath);
		if (index === -1) return null;
		this.client.components.commands.splice(index, 1);
		const imported = await magicImport(component.__filePath).then(x => x.default ?? x);
		const options = (this.client as PluginComponentLoadOptionsProvider).createPluginComponentLoadOptions?.() ?? {};
		const command = this.materializeComponent(imported, options, component.__filePath);
		if (!command) return null;
		this.client.components.commands.splice(index, 0, command);
		return imported;
	}

	async reloadAll(stopIfFail = true) {
		for (const i of this.commands) {
			try {
				await this.reload(i.__filePath ?? '');
			} catch (e) {
				if (stopIfFail) {
					throw e;
				}
			}
		}
	}

	async execute(i: ComponentCommands, context: ComponentContext | ModalContext) {
		return runContextScopes(context.client.options.contextScopes, context, async () => {
			try {
				await i.onBeforeMiddlewares?.(context as never);
				const resultRunGlobalMiddlewares = await BaseCommand.__runMiddlewares(
					context,
					(context.client.options?.globalMiddlewares ?? []) as readonly (keyof ResolvedRegisteredMiddlewares)[],
					true,
				);
				if (resultRunGlobalMiddlewares.pass) {
					return;
				}
				if ('error' in resultRunGlobalMiddlewares) {
					return await i.onMiddlewaresError?.(
						context as never,
						resultRunGlobalMiddlewares.error ?? 'Unknown error',
						resultRunGlobalMiddlewares.metadata ?? { middleware: 'unknown', scope: 'global' },
					);
				}

				const resultRunMiddlewares = await BaseCommand.__runMiddlewares(context, i.middlewares, false);
				if (resultRunMiddlewares.pass) {
					return;
				}
				if ('error' in resultRunMiddlewares) {
					return await i.onMiddlewaresError?.(
						context as never,
						resultRunMiddlewares.error ?? 'Unknown error',
						resultRunMiddlewares.metadata ?? { middleware: 'unknown', scope: 'command' },
					);
				}

				try {
					await i.run(context as never);
					await i.onAfterRun?.(context as never, undefined);
				} catch (error) {
					await i.onRunError?.(context as never, error);
					await i.onAfterRun?.(context as never, error);
				}
			} catch (error) {
				try {
					await i.onInternalError?.(this.client, i as never, error);
				} catch (err) {
					this.client.logger.error(`[${i.customId ?? 'Component/Modal command'}] Internal error:`, err);
				}
			}
		});
	}

	async executeComponent(context: ComponentContext) {
		for (const i of this.commands) {
			try {
				if (
					i.type === InteractionCommandType.COMPONENT &&
					i.cType === context.interaction.componentType &&
					(await i._filter(context))
				) {
					context.command = i;
					await this.execute(i, context);
				}
			} catch (e) {
				await this.onFail(e);
			}
		}
	}

	async executeModal(context: ModalContext) {
		for (const i of this.commands) {
			try {
				if (i.type === InteractionCommandType.MODAL && (await i._filter(context))) {
					context.command = i;
					await this.execute(i, context);
				}
			} catch (e) {
				await this.onFail(e);
			}
		}
	}

	onFile(file: FileLoaded<HandleableComponentCommand>): HandleableComponentCommand[] | undefined {
		return file.default ? [file.default] : undefined;
	}

	callback(file: SeteableComponentCommand, create?: ComponentLoadCreator): ComponentCommands | false {
		if (typeof file !== 'function') return file;
		const kind = file.prototype instanceof ModalCommand ? 'modal' : 'component';
		return create?.(kind, file, () => new file()) ?? new file();
	}
}

export type HandleableComponentCommand = (new () => ComponentCommand) | (new () => ModalCommand);
export type SeteableComponentCommand = HandleableComponentCommand | ComponentCommands;
export type ComponentLoadKind = 'component' | 'modal';
export type ComponentLoadCreator = <T extends HandleableComponentCommand>(
	kind: ComponentLoadKind,
	constructor: T,
	next: () => InstanceType<T>,
) => InstanceType<T>;
export type ComponentLoadTransformer = (
	kind: ComponentLoadKind,
	component: ComponentCommands,
) => ComponentCommands | false | void;
export interface ComponentLoadOptions {
	create?: ComponentLoadCreator;
	transform?: ComponentLoadTransformer;
}
