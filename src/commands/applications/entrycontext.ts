import { MessageFlags } from '../../types';
import type { ReturnCache } from '../..';
import type {
	InteractionCreateBodyRequest,
	InteractionMessageUpdateBodyRequest,
	ModalCreateBodyRequest,
	UnionToTuple,
	When,
} from '../../common';
import type { AllChannels, EntryPointInteraction } from '../../structures';
import { BaseContext } from '../basecontext';
import type { RegisteredMiddlewares } from '../decorators';
import type { CommandMetadata, ExtendContext, GlobalMetadata, UsingClient } from './shared';
import type {
	GuildMemberStructure,
	GuildStructure,
	MessageStructure,
	WebhookMessageStructure,
} from '../../client/transformers';
import type { EntryPointCommand } from './entryPoint';

export interface EntryPointContext<M extends keyof RegisteredMiddlewares = never> extends BaseContext, ExtendContext {}

export class EntryPointContext<M extends keyof RegisteredMiddlewares = never> extends BaseContext {
	constructor(
		readonly client: UsingClient,
		readonly interaction: EntryPointInteraction,
		readonly shardId: number,
		readonly command: EntryPointCommand,
	) {
		super(client);
	}

	metadata: CommandMetadata<UnionToTuple<M>> = {} as never;
	globalMetadata: GlobalMetadata = {};

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
}
