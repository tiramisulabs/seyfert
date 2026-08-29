import type { ReturnCache } from '../../cache';
import type {
	GuildMemberStructure,
	GuildStructure,
	InteractionGuildMemberStructure,
	UserStructure,
	WebhookMessageStructure,
} from '../../client/transformers';
import type {
	InteractionCreateBodyRequest,
	InteractionMessageUpdateBodyRequest,
	MakeRequired,
	MessageWebhookCreateBodyRequest,
	ModalCreateBodyRequest,
	ModalCreateOptions,
	When,
} from '../../common';
import type { AllChannels, EntryPointInteraction, ModalSubmitInteraction } from '../../structures';
import { MessageFlags, type RESTGetAPIGuildQuery } from '../../types';
import { BaseContext, resolveContextChannel, resolveContextGuild, resolveContextMember } from '../basecontext';
import type { ResolvedRegisteredMiddlewares } from '../decorators';
import type { EntryPointCommand } from './entryPoint';
import type { CommandMetadata, ExtendContext, GlobalMetadata, UsingClient } from './shared';

export interface EntryPointContext<M extends keyof ResolvedRegisteredMiddlewares = never>
	extends BaseContext,
		ExtendContext {}

export class EntryPointContext<M extends keyof ResolvedRegisteredMiddlewares = never> extends BaseContext {
	constructor(
		readonly client: UsingClient,
		readonly interaction: EntryPointInteraction,
		readonly shardId: number,
		readonly command: EntryPointCommand,
	) {
		super(client);
	}

	metadata: CommandMetadata<M> = {} as never;
	globalMetadata: GlobalMetadata = {};

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

	isEntryPoint(): this is EntryPointContext<M> {
		return true;
	}

	inGuild(): this is GuildEntryPointContext<M> {
		return !!this.guildId;
	}
}

export interface GuildEntryPointContext<M extends keyof ResolvedRegisteredMiddlewares = never>
	extends Omit<MakeRequired<EntryPointContext<M>, 'guildId' | 'member'>, 'guild' | 'me'> {
	guild(mode?: 'rest' | 'flow'): Promise<GuildStructure<'cached' | 'api'>>;
	guild(mode: 'cache'): ReturnCache<GuildStructure<'cached'> | undefined>;

	me(mode?: 'rest' | 'flow'): Promise<GuildMemberStructure>;
	me(mode: 'cache'): ReturnCache<GuildMemberStructure | undefined>;
}
