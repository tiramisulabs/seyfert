import type {
	ComponentCallback,
	ComponentOnErrorCallback,
	ComponentRefreshCallback,
	ComponentStopCallback,
	ListenerOptions,
	ModalSubmitCallback,
} from '../builders/types';
import { LimitedCollection } from '../collection';
import { BaseCommand, type RegisteredMiddlewares, type UsingClient } from '../commands';
import type { FileLoaded } from '../commands/handler';
import { BaseHandler, type Logger, type OnFailCallback, isCloudfareWorker, magicImport } from '../common';
import type { ComponentInteraction, ModalSubmitInteraction, StringSelectMenuInteraction } from '../structures';
import { ComponentCommand, InteractionCommandType } from './componentcommand';
import type { ComponentContext } from './componentcontext';
import { ModalCommand } from './modalcommand';
import type { ModalContext } from './modalcontext';

type UserMatches = string | string[] | RegExp;
type COMPONENTS = {
	components: { match: MatchCallback; callback: ComponentCallback }[];
	options?: ListenerOptions;
	messageId: string;
	channelId: string;
	guildId: string | undefined;
	idle?: NodeJS.Timeout;
	timeout?: NodeJS.Timeout;
	onError?: ComponentOnErrorCallback;
	__run: (customId: UserMatches, callback: ComponentCallback) => any;
};

export type MatchCallback = (str: string) => boolean;
export type CollectorInteraction = ComponentInteraction | StringSelectMenuInteraction;
export type ComponentCommands = ComponentCommand | ModalCommand;
export interface CreateComponentCollectorResult {
	run<T extends CollectorInteraction = CollectorInteraction>(
		customId: UserMatches,
		callback: ComponentCallback<T>,
	): void;
	stop(reason?: string): void;
	resetTimeouts(): void;
}

export class ComponentHandler extends BaseHandler {
	onFail: OnFailCallback = err => this.logger.warn('<Client>.components.onFail', err);
	readonly values = new Map<string, COMPONENTS>();
	// 10 minutes of timeout by default, because discord doesnt send an event when the user cancels the modal
	readonly modals = new LimitedCollection<string, ModalSubmitCallback>({ expire: 60e3 * 10 });
	readonly commands: ComponentCommands[] = [];
	filter = (path: string) => path.endsWith('.js') || (!path.endsWith('.d.ts') && path.endsWith('.ts'));

	constructor(
		logger: Logger,
		protected client: UsingClient,
	) {
		super(logger);
	}

	private createMatchCallback(match: UserMatches): MatchCallback {
		if (typeof match === 'string') return str => str === match;
		if (Array.isArray(match)) return str => match.includes(str);
		return str => match.test(str);
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

		return {
			//@ts-expect-error generic
			run: this.values.get(messageId)!.__run,
			stop: (reason?: string) => {
				const old = this.clearValue(messageId);
				if (!old) return;
				options.onStop?.(reason, () => {
					this.createComponentCollector(messageId, channelId, guildId, options, old.components);
				});
			},
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
		return this.modals.has(interaction.user.id);
	}

	onModalSubmit(interaction: ModalSubmitInteraction) {
		setImmediate(() => this.modals.delete(interaction.user.id));
		return this.modals.get(interaction.user.id)?.(interaction);
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
		return component;
	}

	stablishDefaults(component: ComponentCommands) {
		component.props ??= this.client.options.commands?.defaults?.props ?? {};
		const is = component instanceof ModalCommand ? 'modals' : 'components';
		component.onInternalError ??= this.client.options?.[is]?.defaults?.onInternalError;
		component.onMiddlewaresError ??= this.client.options?.[is]?.defaults?.onMiddlewaresError;
		component.onRunError ??= this.client.options?.[is]?.defaults?.onRunError;
		component.onAfterRun ??= this.client.options?.[is]?.defaults?.onAfterRun;
		component.onBeforeMiddlewares ??= this.client.options?.[is]?.defaults?.onBeforeMiddlewares;
	}

	set(instances: (new () => ComponentCommands)[]) {
		for (const i of instances) {
			let component: ReturnType<typeof this.callback>;
			try {
				component = this.callback(i);
				if (!component) continue;
			} catch (e) {
				this.logger.warn(e, i);
				continue;
			}
			this.stablishDefaults(component);

			this.commands.push(component);
		}
	}

	async load(componentsDir: string) {
		const paths = await this.loadFilesK<FileLoaded<new () => ComponentCommands>>(await this.getFiles(componentsDir));

		for (const { components, file } of paths.map(x => ({ components: this.onFile(x.file), file: x }))) {
			if (!components) continue;
			for (const value of components) {
				let component: ReturnType<typeof this.callback>;
				try {
					component = this.callback(value);
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
				this.stablishDefaults(component);
				component.__filePath = file.path;
				this.commands.push(component);
			}
		}
	}

	async reload(path: string) {
		if (!this.client.components) return;
		if (isCloudfareWorker()) {
			throw new Error('Reload in cloudfare worker is not supported');
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
		const command = new imported();
		command.__filePath = component.__filePath;
		this.client.components.commands.push(command);
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
		try {
			await i.onBeforeMiddlewares?.(context as never);
			const resultRunGlobalMiddlewares = await BaseCommand.__runMiddlewares(
				context,
				(context.client.options?.globalMiddlewares ?? []) as keyof RegisteredMiddlewares,
				true,
			);
			if (resultRunGlobalMiddlewares.pass) {
				return;
			}
			if ('error' in resultRunGlobalMiddlewares) {
				return await i.onMiddlewaresError?.(context as never, resultRunGlobalMiddlewares.error ?? 'Unknown error');
			}

			const resultRunMiddlewares = await BaseCommand.__runMiddlewares(context, i.middlewares, false);
			if (resultRunMiddlewares.pass) {
				return;
			}
			if ('error' in resultRunMiddlewares) {
				return await i.onMiddlewaresError?.(context as never, resultRunMiddlewares.error ?? 'Unknown error');
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
				await i.onInternalError?.(this.client, error);
			} catch (err) {
				this.client.logger.error(`[${i.customId ?? 'Component/Modal command'}] Internal error:`, err);
			}
		}
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

	onFile(file: FileLoaded<new () => ComponentCommands>): (new () => ComponentCommands)[] | undefined {
		return file.default ? [file.default] : undefined;
	}

	callback(file: { new (): ComponentCommands }): ComponentCommands | false {
		return new file();
	}
}
