import type { ContextMenuCommand, ReturnCache } from '../..';
import {
	type GuildMemberStructure,
	type GuildStructure,
	type MessageStructure,
	Transformers,
	type UserStructure,
} from '../../client/transformers';
import {
	type InteractionCreateBodyRequest,
	type InteractionMessageUpdateBodyRequest,
	type MakeRequired,
	type ModalCreateBodyRequest,
	type UnionToTuple,
	toSnakeCase,
} from '../../common';
import type { AllChannels, MessageCommandInteraction, UserCommandInteraction } from '../../structures';
import { type APIMessage, ApplicationCommandType, MessageFlags } from '../../types';
import { BaseContext } from '../basecontext';
import type { RegisteredMiddlewares } from '../decorators';
import type { CommandMetadata, ExtendContext, GlobalMetadata, UsingClient } from './shared';

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

	write<WR extends boolean = false>(body: InteractionCreateBodyRequest, withResponse?: WR) {
		return this.interaction.write<WR>(body, withResponse);
	}

	modal(body: ModalCreateBodyRequest) {
		return this.interaction.modal(body);
	}

	deferReply<WR extends boolean = false>(ephemeral = false, withResponse?: WR) {
		return this.interaction.deferReply<WR>(ephemeral ? MessageFlags.Ephemeral : undefined, withResponse);
	}

	editResponse(body: InteractionMessageUpdateBodyRequest) {
		return this.interaction.editResponse(body);
	}

	deleteResponse() {
		return this.interaction.deleteResponse();
	}

	editOrReply<WR extends boolean = false>(
		body: InteractionCreateBodyRequest | InteractionMessageUpdateBodyRequest,
		withResponse?: WR,
	) {
		return this.interaction.editOrReply<WR>(body as InteractionCreateBodyRequest, withResponse);
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

	inGuild(): this is GuildMenuCommandContext<T, M> {
		return !!this.guildId;
	}
}

export interface GuildMenuCommandContext<
	T extends MessageCommandInteraction | UserCommandInteraction,
	M extends keyof RegisteredMiddlewares = never,
> extends Omit<MakeRequired<MenuCommandContext<T, M>, 'guildId' | 'member'>, 'guild'> {
	guild(mode?: 'rest' | 'flow'): Promise<GuildStructure<'cached' | 'api'>>;
	guild(mode?: 'cache'): ReturnCache<GuildStructure<'cached'> | undefined>;
}
