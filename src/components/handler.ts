import type { ComponentCallback, ListenerOptions, ModalSubmitCallback } from '../builders/types';
import { LimitedCollection } from '../collection';
import type { UsingClient } from '../commands';
import { BaseHandler, magicImport, type Logger, type OnFailCallback } from '../common';
import type { ComponentInteraction, ModalSubmitInteraction, StringSelectMenuInteraction } from '../structures';
import { ComponentCommand, InteractionCommandType, ModalCommand } from './command';
import { ComponentContext } from './componentcontext';

type COMPONENTS = {
	components: { match: string | string[] | RegExp; callback: ComponentCallback }[];
	options?: ListenerOptions;
	messageId?: string;
	idle?: NodeJS.Timeout;
	timeout?: NodeJS.Timeout;
	__run: (customId: string | string[] | RegExp, callback: ComponentCallback) => any;
};

export class ComponentHandler extends BaseHandler {
	onFail: OnFailCallback = err => this.logger.warn('<Client>.components.onFail', err);
	readonly values = new Map<string, COMPONENTS>();
	// 10 minutes timeout, because discord dont send an event when the user cancel the modal
	readonly modals = new LimitedCollection<string, ModalSubmitCallback>({ expire: 60e3 * 10 });
	readonly commands: (ComponentCommand | ModalCommand)[] = [];
	protected filter = (path: string) => path.endsWith('.js') || (!path.endsWith('.d.ts') && path.endsWith('.ts'));

	constructor(
		logger: Logger,
		protected client: UsingClient,
	) {
		super(logger);
	}

	createComponentCollector(
		messageId: string,
		options: ListenerOptions = {},
	): {
		run<
			T extends ComponentInteraction | StringSelectMenuInteraction = ComponentInteraction | StringSelectMenuInteraction,
		>(customId: string | string[] | RegExp, callback: ComponentCallback<T>): any;
		stop(reason?: string): any;
	} {
		this.values.set(messageId, {
			components: [],
			options,
			idle: options.idle
				? setTimeout(() => {
						this.deleteValue(messageId);
						options.onStop?.('idle', () => {
							this.createComponentCollector(messageId, options);
						});
				  }, options.idle)
				: undefined,
			timeout: options.timeout
				? setTimeout(() => {
						this.deleteValue(messageId);
						options.onStop?.('timeout', () => {
							this.createComponentCollector(messageId, options);
						});
				  }, options.timeout)
				: undefined,
			__run: (customId, callback) => {
				if (this.values.has(messageId)) {
					this.values.get(messageId)!.components.push({
						callback,
						match: customId,
					});
				}
			},
		});

		return {
			//@ts-expect-error generic
			run: this.values.get(messageId)!.__run,
			stop: (reason?: string) => {
				this.deleteValue(messageId);
				options.onStop?.(reason, () => {
					this.createComponentCollector(messageId, options);
				});
			},
		};
	}

	async onComponent(id: string, interaction: ComponentInteraction) {
		const row = this.values.get(id)!;
		const component = row?.components?.find(x => {
			if (typeof x.match === 'string') return x.match === interaction.customId;
			if (Array.isArray(x.match)) return x.match.includes(interaction.customId);
			return interaction.customId.match(x.match);
		});
		if (!component) return;
		if (row.options?.filter) {
			if (!(await row.options.filter(interaction))) return;
		}
		row.idle?.refresh();
		await component.callback(
			interaction,
			reason => {
				row.options?.onStop?.(reason ?? 'stop');
				this.deleteValue(id);
			},
			() => {
				this.resetTimeouts(id);
			},
		);
	}

	hasComponent(id: string, customId: string) {
		return (
			this.values.get(id)?.components?.some(x => {
				if (typeof x.match === 'string') return x.match === customId;
				if (Array.isArray(x.match)) return x.match.includes(customId);
				return customId.match(x.match);
			}) ?? false
		);
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
		const component = this.values.get(id);
		if (component) {
			if (reason !== undefined) component.options?.onStop?.(reason);
			clearTimeout(component.timeout);
			clearTimeout(component.idle);
			this.values.delete(id);
		}
	}

	onMessageDelete(id: string) {
		this.deleteValue(id, 'messageDelete');
	}

	async load(componentsDir: string, instances?: { new (): ModalCommand | ComponentCommand }[]) {
		const paths =
			instances?.map(x => {
				const i = new x();
				return { file: x, path: i.__filePath ?? '*' };
			}) ?? (await this.loadFilesK<{ new (): ModalCommand | ComponentCommand }>(await this.getFiles(componentsDir)));

		for (let i = 0; i < paths.length; i++) {
			let component;
			try {
				component = this.callback(paths[i].file);
				if (!component) continue;
			} catch (e) {
				if (e instanceof Error && e.message === 'paths[i].file is not a constructor') {
					this.logger.warn(
						`${paths[i].path
							.split(process.cwd())
							.slice(1)
							.join(process.cwd())} doesn't export the class by \`export default <ComponentCommand>\``,
					);
				} else this.logger.warn(e, paths[i]);
				continue;
			}
			if (!(component instanceof ModalCommand) && !(component instanceof ComponentCommand)) continue;
			component.__filePath = paths[i].path;
			this.commands.push(component);
		}
	}

	async reload(path: string) {
		if (!this.client.components) return;
		const component = this.client.components.commands.find(
			x =>
				x.__filePath?.endsWith(`${path}.js`) ||
				x.__filePath?.endsWith(`${path}.ts`) ||
				x.__filePath?.endsWith(path) ||
				x.__filePath === path,
		);
		if (!component || !component.__filePath) return null;
		delete require.cache[component.__filePath];
		const index = this.client.components.commands.findIndex(x => x.__filePath === component.__filePath!);
		if (index === -1) return null;
		this.client.components.commands.splice(index, 1);
		const imported = await magicImport(component.__filePath).then(x => x.default ?? x);
		const command = new imported();
		command.__filePath = component.__filePath;
		this.client.components.commands.push(command);
		return imported;
	}

	async reloadAll() {
		if (!this.client.components) return;
		for (const i of this.client.components.commands) {
			if (!i.__filePath) return this.logger.warn('Unknown command dont have __filePath property', i);
			await this.reload(i.__filePath);
		}
	}

	async executeComponent(interaction: ComponentInteraction) {
		for (const i of this.commands) {
			try {
				if (i.type === InteractionCommandType.COMPONENT && i.cType === interaction.componentType) {
					const context = new ComponentContext(this.client, interaction);
					const extended = this.client.options?.context?.(interaction) ?? {};
					Object.assign(context, extended);
					if (!(await i.filter(context))) continue;
					await i.run(context);
					break;
				}
			} catch (e) {
				await this.onFail(e);
			}
		}
	}

	async executeModal(interaction: ModalSubmitInteraction) {
		for (const i of this.commands) {
			try {
				if (i.type === InteractionCommandType.MODAL && (await i.filter(interaction))) {
					await i.run(interaction);
					break;
				}
			} catch (e) {
				await this.onFail(e);
			}
		}
	}

	setHandlers({ callback }: { callback: ComponentHandler['callback'] }) {
		this.callback = callback;
	}

	callback = (file: { new (): ModalCommand | ComponentCommand }): ModalCommand | ComponentCommand | false => new file();
}
