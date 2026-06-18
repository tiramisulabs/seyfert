import type { ReturnCache } from '../../cache';
import type { Client, WorkerClient } from '../../client';
import type {
	BaseGuildChannelStructure,
	GuildMemberStructure,
	GuildStructure,
	InteractionGuildMemberStructure,
	MessageStructure,
	OptionResolverStructure,
	UserStructure,
	WebhookMessageStructure,
} from '../../client/transformers';
import { type If, type MakeRequired, SeyfertError, type When } from '../../common';
import type {
	InteractionCreateBodyRequest,
	InteractionMessageUpdateBodyRequest,
	MessageWebhookCreateBodyRequest,
	ModalCreateBodyRequest,
	ModalCreateOptions,
} from '../../common/types/write';
import { createEphemeralResponseBody } from '../../common/types/write';
import {
	type AllChannels,
	type AllGuildChannels,
	ChatInputCommandInteraction,
	type Message,
	type ModalSubmitInteraction,
} from '../../structures';
import { MessageFlags, type RESTGetAPIGuildQuery } from '../../types';
import { BaseContext } from '../basecontext';
import type { ResolvedRegisteredMiddlewares } from '../decorators';
import type { Command, ContextOptions, OptionsRecord, SubCommand } from './chat';
import type { CommandMetadata, ExtendContext, GlobalMetadata, InferWithPrefix, UsingClient } from './shared';

type GuildCommandChannel = AllGuildChannels | BaseGuildChannelStructure;

export interface CommandContext<T extends OptionsRecord = {}, M extends keyof ResolvedRegisteredMiddlewares = never>
	extends BaseContext,
		ExtendContext {
	/**@internal */
	__edited?: true;
	/**@internal */
	__deferred?: true;
}

export class CommandContext<
	T extends OptionsRecord = {},
	M extends keyof ResolvedRegisteredMiddlewares = never,
> extends BaseContext {
	message!: If<InferWithPrefix, MessageStructure | undefined, undefined>;
	interaction!: If<InferWithPrefix, ChatInputCommandInteraction | undefined, ChatInputCommandInteraction>;

	messageResponse?: If<InferWithPrefix, MessageStructure | undefined, undefined>;
	constructor(
		readonly client: UsingClient,
		data: ChatInputCommandInteraction | MessageStructure,
		readonly resolver: OptionResolverStructure,
		readonly shardId: number,
		readonly command: Command | SubCommand,
	) {
		super(client);
		if (data instanceof ChatInputCommandInteraction) {
			this.interaction = data;
		} else {
			this.message = data as never;
		}
	}

	options: ContextOptions<T> = {} as never;
	metadata: CommandMetadata<M> = {} as never;
	globalMetadata: GlobalMetadata = {};

	get t() {
		return this.client.t(
			this.client.langs.preferGuildLocale
				? (this.interaction?.guildLocale ?? this.interaction?.locale ?? this.client.langs.defaultLang ?? 'en-US')
				: (this.interaction?.locale ?? this.client.langs.defaultLang ?? 'en-US'),
		);
	}

	get fullCommandName() {
		return this.resolver.fullCommandName;
	}

	get deferred() {
		return !!this.__deferred;
	}

	async write<WR extends boolean = false>(
		body: InteractionCreateBodyRequest,
		withResponse?: WR,
	): Promise<When<WR, WebhookMessageStructure | When<InferWithPrefix, MessageStructure, never>, void>> {
		if (this.interaction) return this.interaction.write(body, withResponse);
		const options = (this.client as Client | WorkerClient).options?.commands;
		return ((this.messageResponse as MessageStructure | undefined) = await (this.message! as Message)[
			!(this.messageResponse as MessageStructure | undefined) && (await options?.reply?.(this)) ? 'reply' : 'write'
		](body)) as never;
	}

	async ephemeral<WR extends boolean = false>(
		body: InteractionCreateBodyRequest,
		withResponse?: WR,
	): Promise<When<WR, WebhookMessageStructure | When<InferWithPrefix, MessageStructure, never>, void>> {
		return this.write<WR>(this.interaction ? createEphemeralResponseBody(body) : body, withResponse);
	}

	modal(body: ModalCreateBodyRequest, options?: undefined): Promise<undefined>;
	modal(body: ModalCreateBodyRequest, options: ModalCreateOptions): Promise<ModalSubmitInteraction | null>;
	modal(body: ModalCreateBodyRequest, options?: ModalCreateOptions | undefined) {
		if (!this.interaction) throw new SeyfertError('CANNOT_USE_MODAL');
		if (options === undefined) return this.interaction.modal(body);
		return this.interaction.modal(body, options);
	}

	async deferReply<WR extends boolean = false>(
		ephemeral = false,
		withResponse?: WR,
	): Promise<
		When<
			WR,
			WebhookMessageStructure | When<InferWithPrefix, MessageStructure, never>,
			When<InferWithPrefix, MessageStructure, never> | undefined
		>
	> {
		if (this.interaction)
			return this.interaction.deferReply(ephemeral ? MessageFlags.Ephemeral : undefined, withResponse);
		this.__deferred = true;
		const options = (this.client as Client | WorkerClient).options?.commands;
		return ((this.messageResponse as MessageStructure | undefined) = await (this.message! as Message)[
			(await options?.reply?.(this)) ? 'reply' : 'write'
		]((await options?.deferReplyResponse?.(this)) ?? { content: 'Thinking...' })) as never;
	}

	async editResponse(
		body: InteractionMessageUpdateBodyRequest,
	): Promise<When<InferWithPrefix, WebhookMessageStructure | MessageStructure, WebhookMessageStructure>> {
		if (this.interaction) return this.interaction.editResponse(body);
		if (this.__deferred && !this.__edited) {
			this.__edited = true;
			if ((this.messageResponse as MessageStructure | undefined)?.content) body.content ??= '';
			if ((this.messageResponse as MessageStructure | undefined)?.embeds.length) body.embeds ??= [];
		}
		return ((this.messageResponse as MessageStructure | undefined) = await (
			this.messageResponse as unknown as MessageStructure
		).edit(body)) as never;
	}

	deleteResponse() {
		if (this.interaction) return this.interaction.deleteResponse();
		return (this.messageResponse as unknown as MessageStructure).delete();
	}

	editOrReply<WR extends boolean = false>(
		body: InteractionCreateBodyRequest | InteractionMessageUpdateBodyRequest,
		withResponse?: WR,
	): Promise<When<WR, WebhookMessageStructure | When<InferWithPrefix, MessageStructure, never>, void>> {
		if (this.interaction) return this.interaction.editOrReply(body as InteractionCreateBodyRequest, withResponse);
		if (this.messageResponse as MessageStructure | undefined) {
			return this.editResponse(body) as never;
		}
		return this.write(body as InteractionCreateBodyRequest, withResponse);
	}

	followup(
		body: MessageWebhookCreateBodyRequest,
	): Promise<If<InferWithPrefix, WebhookMessageStructure | MessageStructure, WebhookMessageStructure>> {
		if (this.interaction) return this.interaction.followup(body);
		return (this.messageResponse as unknown as MessageStructure).reply(body) as never;
	}

	async fetchResponse(): Promise<
		If<InferWithPrefix, WebhookMessageStructure | MessageStructure, WebhookMessageStructure>
	> {
		if (this.interaction) return this.interaction.fetchResponse();
		return ((this.messageResponse as MessageStructure | undefined) = await (
			this.messageResponse as unknown as MessageStructure
		).fetch()) as never;
	}

	channel(mode?: 'rest' | 'flow'): Promise<AllChannels>;
	channel(mode: 'cache'): ReturnCache<If<InferWithPrefix, AllChannels | undefined, AllChannels>>;
	channel(mode: 'cache' | 'rest' | 'flow' = 'flow') {
		if (this.interaction && mode === 'cache')
			return this.client.cache.adapter.isAsync ? Promise.resolve(this.interaction.channel) : this.interaction.channel;
		switch (mode) {
			case 'cache':
				return (
					this.client.cache.channels?.get(this.channelId) ||
					(this.client.cache.adapter.isAsync ? (Promise.resolve() as any) : undefined)
				);
			default:
				return this.client.channels.fetch(this.channelId, mode === 'rest');
		}
	}

	me(mode?: 'rest' | 'flow'): Promise<GuildMemberStructure | undefined>;
	me(mode: 'cache'): ReturnCache<GuildMemberStructure | undefined>;
	me(mode: 'cache' | 'rest' | 'flow' = 'flow') {
		if (!this.guildId)
			return mode === 'cache' ? (this.client.cache.adapter.isAsync ? Promise.resolve() : undefined) : Promise.resolve();
		switch (mode) {
			case 'cache':
				return (
					this.client.cache.members?.get(this.client.botId, this.guildId) ||
					(this.client.cache.adapter.isAsync ? (Promise.resolve() as any) : undefined)
				);
			default:
				return this.client.members.fetch(this.guildId, this.client.botId, mode === 'rest');
		}
	}

	fetchMember(mode?: 'rest' | 'flow'): Promise<GuildMemberStructure | undefined>;
	fetchMember(mode: 'cache'): ReturnCache<GuildMemberStructure | undefined>;
	fetchMember(mode: 'cache' | 'rest' | 'flow' = 'flow'): any {
		if (!this.guildId)
			return mode === 'cache' ? (this.client.cache.adapter.isAsync ? Promise.resolve() : undefined) : Promise.resolve();
		switch (mode) {
			case 'cache':
				return (
					this.client.cache.members?.get(this.author.id, this.guildId) ||
					(this.client.cache.adapter.isAsync ? (Promise.resolve() as any) : undefined)
				);
			default:
				return this.client.members.fetch(this.guildId, this.author.id, mode === 'rest');
		}
	}

	guild(mode?: 'rest' | 'flow', query?: RESTGetAPIGuildQuery): Promise<GuildStructure<'cached' | 'api'> | undefined>;
	guild(mode: 'cache', query?: RESTGetAPIGuildQuery): ReturnCache<GuildStructure<'cached'> | undefined>;
	guild(mode: 'cache' | 'rest' | 'flow' = 'flow', query?: RESTGetAPIGuildQuery) {
		if (!this.guildId)
			return mode === 'cache' ? (this.client.cache.adapter.isAsync ? Promise.resolve() : undefined) : Promise.resolve();
		switch (mode) {
			case 'cache':
				return (
					this.client.cache.guilds?.get(this.guildId) ||
					(this.client.cache.adapter.isAsync ? (Promise.resolve() as any) : undefined)
				);
			default:
				return this.client.guilds.fetch(this.guildId, { force: mode === 'rest', query });
		}
	}

	get guildId() {
		return this.interaction?.guildId || (this.message! as MessageStructure | undefined)?.guildId;
	}

	get channelId() {
		return this.interaction?.channel.id || (this.message! as MessageStructure).channelId;
	}

	get author(): UserStructure {
		return this.interaction?.user || (this.message! as MessageStructure).author;
	}

	get member(): If<
		InferWithPrefix,
		GuildMemberStructure | InteractionGuildMemberStructure | undefined,
		InteractionGuildMemberStructure | undefined
	> {
		return this.interaction?.member || ((this.message! as MessageStructure)?.member as any);
	}

	isChat(): this is CommandContext<T, M> {
		return true;
	}

	inGuild(): this is GuildCommandContext<T, M> {
		return !!this.guildId;
	}
}

export interface GuildCommandContext<
	T extends OptionsRecord = {},
	M extends keyof ResolvedRegisteredMiddlewares = never,
> extends Omit<MakeRequired<CommandContext<T, M>, 'guildId' | 'member'>, 'channel' | 'guild' | 'me' | 'fetchMember'> {
	channel(mode?: 'rest' | 'flow'): Promise<GuildCommandChannel>;
	channel(mode: 'cache'): ReturnCache<If<InferWithPrefix, GuildCommandChannel | undefined, GuildCommandChannel>>;

	guild(mode?: 'rest' | 'flow'): Promise<GuildStructure<'cached' | 'api'>>;
	guild(mode: 'cache'): ReturnCache<GuildStructure<'cached'> | undefined>;

	me(mode?: 'rest' | 'flow'): Promise<GuildMemberStructure>;
	me(mode: 'cache'): ReturnCache<GuildMemberStructure | undefined>;

	fetchMember(mode?: 'rest' | 'flow'): Promise<GuildMemberStructure>;
	fetchMember(mode: 'cache'): ReturnCache<GuildMemberStructure | undefined>;
}
