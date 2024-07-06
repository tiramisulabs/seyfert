import { type APIMessage, ApplicationCommandType, MessageFlags } from 'discord-api-types/v10';
import type { ContextMenuCommand, ReturnCache } from '../..';
import {
	toSnakeCase,
	type InteractionCreateBodyRequest,
	type InteractionMessageUpdateBodyRequest,
	type ModalCreateBodyRequest,
	type UnionToTuple,
	type When,
} from '../../common';
import type { AllChannels, MessageCommandInteraction, UserCommandInteraction } from '../../structures';
import { BaseContext } from '../basecontext';
import type { RegisteredMiddlewares } from '../decorators';
import type { CommandMetadata, ExtendContext, GlobalMetadata, UsingClient } from './shared';
import {
	type GuildMemberStructure,
	type GuildStructure,
	type MessageStructure,
	Transformers,
	type UserStructure,
	type WebhookMessageStructure,
} from '../../client/transformers';

export type InteractionTarget<T> = T extends MessageCommandInteraction ? MessageStructure : UserStructure;

export interface MenuCommandContext<
	T extends MessageCommandInteraction | UserCommandInteraction,
	M extends keyof RegisteredMiddlewares = never,
> extends BaseContext,
		ExtendContext {}

export class MenuCommandContext<
	T extends MessageCommandInteraction | UserCommandInteraction,
	M extends keyof RegisteredMiddlewares = never,
> extends BaseContext {
	constructor(
		readonly client: UsingClient,
		readonly interaction: T,
		readonly shardId: number,
		readonly command: ContextMenuCommand,
	) {
		super(client);
	}

	metadata: CommandMetadata<UnionToTuple<M>> = {} as never;
	globalMetadata: GlobalMetadata = {};

	// biome-ignore lint/suspicious/useGetterReturn: default don't exist.
	get target(): InteractionTarget<T> {
		switch (this.interaction.data.type) {
			case ApplicationCommandType.Message: {
				const data = this.interaction.data.resolved.messages[this.interaction.data.targetId as Lowercase<string>];
				return Transformers.Message(this.client, toSnakeCase(data) as APIMessage) as never;
			}
			case ApplicationCommandType.User: {
				const data = this.interaction.data.resolved.users[this.interaction.data.targetId as Lowercase<string>];
				return Transformers.User(this.client, toSnakeCase(data)) as never;
			}
		}
	}

	get t() {
		return this.client.t(this.interaction.locale ?? this.client.langs!.defaultLang ?? 'en-US');
	}

	get fullCommandName() {
		return this.command.name;
	}

	write<FR extends boolean = false>(
		body: InteractionCreateBodyRequest,
		fetchReply?: FR,
	): Promise<When<FR, WebhookMessageStructure, void | WebhookMessageStructure>> {
		return this.interaction.write(body, fetchReply);
	}

	modal(body: ModalCreateBodyRequest) {
		return this.interaction.modal(body);
	}

	deferReply(ephemeral = false) {
		return this.interaction.deferReply(ephemeral ? MessageFlags.Ephemeral : undefined);
	}

	editResponse(body: InteractionMessageUpdateBodyRequest) {
		return this.interaction.editResponse(body);
	}

	deleteResponse() {
		return this.interaction.deleteResponse();
	}

	editOrReply<FR extends boolean = false>(
		body: InteractionCreateBodyRequest | InteractionMessageUpdateBodyRequest,
		fetchReply?: FR,
	): Promise<When<FR, WebhookMessageStructure | MessageStructure, void | WebhookMessageStructure | MessageStructure>> {
		return this.interaction.editOrReply(body as InteractionCreateBodyRequest, fetchReply);
	}

	fetchResponse() {
		return this.interaction.fetchResponse();
	}

	channel(mode?: 'rest' | 'flow'): Promise<AllChannels>;
	channel(mode?: 'cache'): ReturnCache<AllChannels>;
	channel(mode: 'cache' | 'rest' | 'flow' = 'cache') {
		if (this.interaction?.channel && mode === 'cache')
			return this.client.cache.adapter.isAsync ? Promise.resolve(this.interaction.channel) : this.interaction.channel;
		return this.client.channels.fetch(this.channelId, mode === 'rest');
	}

	me(mode?: 'rest' | 'flow'): Promise<GuildMemberStructure>;
	me(mode?: 'cache'): ReturnCache<GuildMemberStructure | undefined>;
	me(mode: 'cache' | 'rest' | 'flow' = 'cache') {
		if (!this.guildId)
			return mode === 'cache' ? (this.client.cache.adapter.isAsync ? Promise.resolve() : undefined) : Promise.resolve();
		switch (mode) {
			case 'cache':
				return this.client.cache.members?.get(this.client.botId, this.guildId);
			default:
				return this.client.members.fetch(this.guildId, this.client.botId, mode === 'rest');
		}
	}

	guild(mode?: 'rest' | 'flow'): Promise<GuildStructure<'cached' | 'api'> | undefined>;
	guild(mode?: 'cache'): ReturnCache<GuildStructure<'cached'> | undefined>;
	guild(mode: 'cache' | 'rest' | 'flow' = 'cache') {
		if (!this.guildId)
			return (
				mode === 'cache' ? (this.client.cache.adapter.isAsync ? Promise.resolve() : undefined) : Promise.resolve()
			) as any;
		switch (mode) {
			case 'cache':
				return this.client.cache.guilds?.get(this.guildId);
			default:
				return this.client.guilds.fetch(this.guildId, mode === 'rest');
		}
	}

	get guildId() {
		return this.interaction.guildId;
	}

	get channelId() {
		return this.interaction.channelId!;
	}

	get author() {
		return this.interaction.user;
	}

	get member() {
		return this.interaction.member;
	}

	isMenu(): this is MenuCommandContext<UserCommandInteraction | MessageCommandInteraction> {
		return true;
	}

	isMenuUser(): this is MenuCommandContext<UserCommandInteraction> {
		return this.interaction.data.type === ApplicationCommandType.User;
	}

	isMenuMessage(): this is MenuCommandContext<MessageCommandInteraction> {
		return this.interaction.data.type === ApplicationCommandType.Message;
	}
}
