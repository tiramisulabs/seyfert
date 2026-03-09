import type { AllChannels, ReturnCache } from '..';
import type {
	GuildMemberStructure,
	GuildStructure,
	InteractionGuildMemberStructure,
	UserStructure,
	WebhookMessageStructure,
} from '../client/transformers';
import type { CommandMetadata, ExtendContext, GlobalMetadata, RegisteredMiddlewares, UsingClient } from '../commands';
import { BaseContext } from '../commands/basecontext';
import type {
	InteractionCreateBodyRequest,
	InteractionMessageUpdateBodyRequest,
	MakeRequired,
	MessageWebhookCreateBodyRequest,
	ModalCreateBodyRequest,
	ModalCreateOptions,
	UnionToTuple,
	When,
} from '../common';
import type { Interaction, ModalSubmitInteraction } from '../structures';
import { MessageFlags, type RESTGetAPIGuildQuery } from '../types';

export interface InteractionResponseContext<I> extends BaseContext, ExtendContext {}

export abstract class InteractionResponseContext<
	I = unknown,
	M extends keyof RegisteredMiddlewares = never,
> extends BaseContext {
	constructor(
		readonly client: UsingClient,
		public interaction: I,
	) {
		super(client);
	}

	metadata: CommandMetadata<UnionToTuple<M>> = {} as never;
	globalMetadata: GlobalMetadata = {};

	private get _interaction() {
		return this.interaction as unknown as Interaction & { customId: string };
	}

	get t() {
		return this.client.t(this._interaction.locale ?? this.client.langs?.defaultLang ?? 'en-US');
	}

	get customId() {
		return this._interaction.customId;
	}

	write<FR extends boolean = false>(
		body: InteractionCreateBodyRequest,
		fetchReply?: FR,
	): Promise<When<FR, WebhookMessageStructure, void>> {
		return this._interaction.write<FR>(body, fetchReply);
	}

	deferReply<FR extends boolean = false>(
		ephemeral = false,
		fetchReply?: FR,
	): Promise<When<FR, WebhookMessageStructure, undefined>> {
		return this._interaction.deferReply<FR>(ephemeral ? MessageFlags.Ephemeral : undefined, fetchReply);
	}

	editResponse(body: InteractionMessageUpdateBodyRequest): Promise<WebhookMessageStructure> {
		return this._interaction.editResponse(body);
	}

	editOrReply<FR extends boolean = false>(
		body: InteractionCreateBodyRequest | InteractionMessageUpdateBodyRequest,
		fetchReply?: FR,
	): Promise<When<FR, WebhookMessageStructure, void>> {
		return this._interaction.editOrReply<FR>(body as InteractionCreateBodyRequest, fetchReply);
	}

	followup(body: MessageWebhookCreateBodyRequest): Promise<WebhookMessageStructure> {
		return this._interaction.followup(body);
	}

	fetchResponse(): Promise<WebhookMessageStructure> {
		return this._interaction.fetchResponse();
	}

	deleteResponse() {
		return this._interaction.deleteResponse();
	}

	modal(body: ModalCreateBodyRequest, options?: undefined): Promise<undefined>;
	modal(body: ModalCreateBodyRequest, options: ModalCreateOptions): Promise<ModalSubmitInteraction | null>;
	modal(body: ModalCreateBodyRequest, options?: ModalCreateOptions | undefined) {
		if (options === undefined) return this._interaction.modal(body);
		return this._interaction.modal(body, options);
	}

	channel(mode?: 'rest' | 'flow'): Promise<AllChannels>;
	channel(mode: 'cache'): ReturnCache<AllChannels>;
	channel(mode: 'cache' | 'rest' | 'flow' = 'flow') {
		if (mode === 'cache')
			return this.client.cache.adapter.isAsync ? Promise.resolve(this._interaction.channel) : this._interaction.channel;
		return this.client.channels.fetch(this.channelId, mode === 'rest');
	}

	me(mode?: 'rest' | 'flow'): Promise<GuildMemberStructure | undefined>;
	me(mode: 'cache'): ReturnCache<GuildMemberStructure | undefined>;
	me(mode: 'cache' | 'rest' | 'flow' = 'flow'): any {
		if (!this.guildId)
			return mode === 'cache' ? (this.client.cache.adapter.isAsync ? Promise.resolve() : undefined) : Promise.resolve();
		switch (mode) {
			case 'cache':
				return this.client.cache.members?.get(this.client.botId, this.guildId);
			default:
				return this.client.members.fetch(this.guildId, this.client.botId, mode === 'rest');
		}
	}

	guild(mode?: 'rest' | 'flow', query?: RESTGetAPIGuildQuery): Promise<GuildStructure<'cached' | 'api'> | undefined>;
	guild(mode: 'cache', query?: RESTGetAPIGuildQuery): ReturnCache<GuildStructure<'cached'> | undefined>;
	guild(mode: 'cache' | 'rest' | 'flow' = 'flow', query?: RESTGetAPIGuildQuery) {
		if (!this.guildId)
			return (
				mode === 'cache' ? (this.client.cache.adapter.isAsync ? Promise.resolve() : undefined) : Promise.resolve()
			) as any;
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
		return this._interaction.guildId;
	}

	get channelId() {
		return this._interaction.channel.id;
	}

	get author(): UserStructure {
		return this._interaction.user;
	}

	get member(): InteractionGuildMemberStructure | undefined {
		return this._interaction.member;
	}

	inGuild(): boolean {
		return !!this.guildId;
	}
}

export interface GuildInteractionResponseContext<M extends keyof RegisteredMiddlewares = never>
	extends Omit<MakeRequired<InteractionResponseContext<unknown, M>, 'guildId' | 'member'>, 'guild' | 'me'> {
	guild(mode?: 'rest' | 'flow'): Promise<GuildStructure<'cached' | 'api'>>;
	guild(mode: 'cache'): ReturnCache<GuildStructure<'cached'> | undefined>;

	me(mode?: 'rest' | 'flow'): Promise<GuildMemberStructure>;
	me(mode: 'cache'): ReturnCache<GuildMemberStructure | undefined>;
}
