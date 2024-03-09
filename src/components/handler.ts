import { Button, Modal, SelectMenu, type BuilderComponents } from '../builders';
import type { ComponentCallback, ModalSubmitCallback } from '../builders/types';
import type { BaseClient } from '../client/base';
import { LimitedCollection } from '../collection';
import {
	BaseHandler,
	InteractionResponseType,
	magicImport,
	type APIMessage,
	type APIModalInteractionResponseCallbackData,
	type Logger,
	type OnFailCallback,
} from '../common';
import type {
	InteractionMessageUpdateBodyRequest,
	MessageCreateBodyRequest,
	MessageUpdateBodyRequest,
	ModalCreateBodyRequest,
	ResolverProps,
} from '../common/types/write';
import type { ComponentInteraction, ModalSubmitInteraction, ReplyInteractionBody } from '../structures';
import { ComponentCommand, InteractionCommandType, ModalCommand } from './command';
import { ComponentsListener } from './listener';

type COMPONENTS = {
	buttons: Partial<
		Record<
			string,
			{
				callback: ComponentCallback;
			}
		>
	>;
	listener: ComponentsListener<BuilderComponents>;
	messageId?: string;
	idle?: NodeJS.Timeout;
	timeout?: NodeJS.Timeout;
};

export class ComponentHandler extends BaseHandler {
	protected onFail?: OnFailCallback;
	readonly values = new Map<string, COMPONENTS>();
	// 10 minutes timeout, because discord dont send an event when the user cancel the modal
	readonly modals = new LimitedCollection<string, ModalSubmitCallback>({ expire: 60e3 * 10 });
	readonly commands: (ComponentCommand | ModalCommand)[] = [];
	protected filter = (path: string) => path.endsWith('.js') || (!path.endsWith('.d.ts') && path.endsWith('.ts'));

	constructor(
		logger: Logger,
		protected client: BaseClient,
	) {
		super(logger);
	}

	set OnFail(cb: OnFailCallback) {
		this.onFail = cb;
	}

	hasComponent(id: string, customId: string) {
		return !!this.values.get(id)?.buttons?.[customId];
	}

	async onComponent(id: string, interaction: ComponentInteraction) {
		const row = this.values.get(id);
		const component = row?.buttons?.[interaction.customId];
		if (!component) return;
		if (row.listener.options?.filter) {
			if (!(await row.listener.options.filter(interaction))) return;
		}
		row.idle?.refresh();
		await component.callback(
			interaction,
			reason => {
				row.listener.options?.onStop?.(reason ?? 'stop');
				this.deleteValue(id);
			},
			() => {
				this.resetTimeouts(id);
			},
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

	__setComponents(id: string, record: NonNullable<ResolverProps['components']>) {
		this.deleteValue(id);
		if (!(record instanceof ComponentsListener)) return;
		const components: COMPONENTS = {
			buttons: {},
			listener: record,
		};

		if ((record.options.idle ?? -1) > 0) {
			components.idle = setTimeout(() => {
				clearTimeout(components.timeout);
				clearTimeout(components.idle);
				record.options?.onStop?.('idle', () => {
					this.__setComponents(id, record);
				});
				this.values.delete(id);
			}, record.options.idle);
		}
		if ((record.options.timeout ?? -1) > 0) {
			components.timeout = setTimeout(() => {
				clearTimeout(components.timeout);
				clearTimeout(components.idle);
				record.options?.onStop?.('timeout', () => {
					this.__setComponents(id, record);
				});
				this.values.delete(id);
			}, record.options.timeout);
		}

		for (const actionRow of record.components) {
			for (const child of actionRow.components) {
				if ((child instanceof SelectMenu || child instanceof Button) && 'custom_id' in child.data) {
					components.buttons[child.data.custom_id!] = {
						callback: child.__exec as ComponentCallback,
					};
				}
			}
		}

		if (Object.entries(components.buttons).length) {
			this.values.set(id, components);
		}
	}

	protected __setModal(id: string, record: APIModalInteractionResponseCallbackData | ModalCreateBodyRequest) {
		if ('__exec' in record) {
			this.modals.set(id, record.__exec!);
		}
	}

	deleteValue(id: string, reason?: string) {
		const component = this.values.get(id);
		if (component) {
			if (reason !== undefined) component.listener.options.onStop?.(reason);
			clearTimeout(component.timeout);
			clearTimeout(component.idle);
			this.values.delete(id);
		}
	}

	onRequestInteraction(interactionId: string, interaction: ReplyInteractionBody) {
		// @ts-expect-error dapi
		if (!interaction.data) {
			return;
		}
		switch (interaction.type) {
			case InteractionResponseType.ChannelMessageWithSource:
			case InteractionResponseType.UpdateMessage:
				if (!interaction.data.components) return;
				this.__setComponents(interactionId, interaction.data.components);
				break;
			case InteractionResponseType.Modal:
				if (!(interaction.data instanceof Modal)) return;
				this.__setModal(interactionId, interaction.data);
				break;
		}
	}

	onMessageDelete(id: string) {
		this.deleteValue(id, 'messageDelete');
	}

	onRequestMessage(body: MessageCreateBodyRequest, message: APIMessage) {
		if (!body.components) {
			return;
		}
		this.__setComponents(message.id, body.components);
	}

	onRequestInteractionUpdate(body: InteractionMessageUpdateBodyRequest, message: APIMessage) {
		if (!body.components) {
			return;
		}
		this.__setComponents(message.interaction!.id, body.components);
	}

	onRequestUpdateMessage(body: MessageUpdateBodyRequest, message: APIMessage) {
		if (!body.components) return;
		this.__setComponents(message.id, body.components);
	}

	async load(componentsDir: string) {
		const paths = await this.loadFilesK<{ new (): ModalCommand | ComponentCommand }>(
			await this.getFiles(componentsDir),
		);

		for (let i = 0; i < paths.length; i++) {
			let component;
			try {
				component = new paths[i].file();
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
		for (const i of this.client.components.commands) {
			if (!i.__filePath) return this.logger.warn('Unknown command dont have __filePath property', i);
			await this.reload(i.__filePath);
		}
	}

	async executeComponent(interaction: ComponentInteraction) {
		for (const i of this.commands) {
			try {
				if (
					i.type === InteractionCommandType.COMPONENT &&
					i.componentType === interaction.componentType &&
					(await i.filter(interaction))
				) {
					await i.run(interaction);
					break;
				}
			} catch (e) {
				await this.onFail?.(e);
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
				await this.onFail?.(e);
			}
		}
	}
}
