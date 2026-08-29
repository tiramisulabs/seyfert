import type { ContextMenuCommand, InteractionGuildMemberStructure, ReturnCache } from '../..';
import {
	type GuildMemberStructure,
	type GuildStructure,
	type MessageStructure,
	Transformers,
	type UserStructure,
	type WebhookMessageStructure,
} from '../../client/transformers';
import {
	type InteractionCreateBodyRequest,
	type InteractionMessageUpdateBodyRequest,
	type MakeRequired,
	type MessageWebhookCreateBodyRequest,
	type ModalCreateBodyRequest,
	type ModalCreateOptions,
	toSnakeCase,
	type When,
} from '../../common';
import type {
	AllChannels,
	MessageCommandInteraction,
	ModalSubmitInteraction,
	UserCommandInteraction,
} from '../../structures';
import { type APIMessage, ApplicationCommandType, MessageFlags, type RESTGetAPIGuildQuery } from '../../types';
import { BaseContext, resolveContextChannel, resolveContextGuild, resolveContextMember } from '../basecontext';
import type { ResolvedRegisteredMiddlewares } from '../decorators';
import type { CommandMetadata, ExtendContext, GlobalMetadata, UsingClient } from './shared';

export type InteractionTarget<T> = T extends MessageCommandInteraction ? MessageStructure : UserStructure;

export interface MenuCommandContext<
	T extends MessageCommandInteraction | UserCommandInteraction,
	M extends keyof ResolvedRegisteredMiddlewares = never,
> extends BaseContext,
		ExtendContext {}

export class MenuCommandContext<
	T extends MessageCommandInteraction | UserCommandInteraction,
	M extends keyof ResolvedRegisteredMiddlewares = never,
> extends BaseContext {
	constructor(
		readonly client: UsingClient,
		readonly interaction: T,
		readonly shardId: number,
		readonly command: ContextMenuCommand,
	) {
		super(client);
	}

	metadata: CommandMetadata<M> = {} as never;
	globalMetadata: GlobalMetadata = {};

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
		return this.client.t(
			this.client.langs.preferGuildLocale
				? (this.interaction.guildLocale ?? this.interaction.locale ?? this.client.langs.defaultLang ?? 'en-US')
				: (this.interaction.locale ?? this.client.langs.defaultLang ?? 'en-US'),
		);
	}

	get fullCommandName() {
		return this.command.name;
	}

	get deferred() {
		return !!this.interaction.deferred;
	}

	write<WR extends boolean = false>(
		body: InteractionCreateBodyRequest,
		withResponse?: WR,
	): Promise<When<WR, WebhookMessageStructure, void>> {
		return this.interaction.write<WR>(body, withResponse);
	}

	modal(body: ModalCreateBodyRequest, options?: undefined): Promise<undefined>;
	modal(body: ModalCreateBodyRequest, options: ModalCreateOptions): Promise<ModalSubmitInteraction | null>;
	modal(body: ModalCreateBodyRequest, options?: ModalCreateOptions | undefined) {
		if (options === undefined) return this.interaction.modal(body);
		return this.interaction.modal(body, options);
	}

	deferReply<WR extends boolean = false>(
		ephemeral = false,
		withResponse?: WR,
	): Promise<When<WR, WebhookMessageStructure, undefined>> {
		return this.interaction.deferReply<WR>(ephemeral ? MessageFlags.Ephemeral : undefined, withResponse);
	}

	editResponse(body: InteractionMessageUpdateBodyRequest): Promise<WebhookMessageStructure> {
		return this.interaction.editResponse(body);
	}

	deleteResponse() {
		return this.interaction.deleteResponse();
	}

	editOrReply<WR extends boolean = false>(
		body: InteractionCreateBodyRequest | InteractionMessageUpdateBodyRequest,
		withResponse?: WR,
	): Promise<When<WR, WebhookMessageStructure, void>> {
		return this.interaction.editOrReply<WR>(body as InteractionCreateBodyRequest, withResponse);
	}

	followup(body: MessageWebhookCreateBodyRequest): Promise<WebhookMessageStructure> {
		return this.interaction.followup(body);
	}

	fetchResponse(): Promise<WebhookMessageStructure> {
		return this.interaction.fetchResponse();
	}

	channel(mode?: 'rest' | 'flow'): Promise<AllChannels>;
	channel(mode: 'cache'): ReturnCache<AllChannels>;
	channel(mode: 'cache' | 'rest' | 'flow' = 'flow') {
		return resolveContextChannel(this.client, this.channelId, mode, this.interaction.channel);
	}

	me(mode?: 'rest' | 'flow'): Promise<GuildMemberStructure | undefined>;
	me(mode: 'cache'): ReturnCache<GuildMemberStructure | undefined>;
	me(mode: 'cache' | 'rest' | 'flow' = 'flow') {
		return resolveContextMember(this.client, this.guildId, this.client.botId, mode);
	}

	guild(mode?: 'rest' | 'flow', query?: RESTGetAPIGuildQuery): Promise<GuildStructure<'cached' | 'api'> | undefined>;
	guild(mode: 'cache', query?: RESTGetAPIGuildQuery): ReturnCache<GuildStructure<'cached'> | undefined>;
	guild(mode: 'cache' | 'rest' | 'flow' = 'flow', query?: RESTGetAPIGuildQuery) {
		return resolveContextGuild(this.client, this.guildId, mode, query);
	}

	get guildId() {
		return this.interaction.guildId;
	}

	get channelId() {
		return this.interaction.channel.id;
	}

	get author(): UserStructure {
		return this.interaction.user;
	}

	get member(): InteractionGuildMemberStructure | undefined {
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
	M extends keyof ResolvedRegisteredMiddlewares = never,
> extends Omit<MakeRequired<MenuCommandContext<T, M>, 'guildId' | 'member'>, 'guild'> {
	guild(mode?: 'rest' | 'flow'): Promise<GuildStructure<'cached' | 'api'>>;
	guild(mode: 'cache'): ReturnCache<GuildStructure<'cached'> | undefined>;
}
