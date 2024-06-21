import { MessageFlags } from 'discord-api-types/v10';
import type { AllChannels, InferWithPrefix, Message, ReturnCache } from '../..';
import type { Client, WorkerClient } from '../../client';
import type { If, UnionToTuple, When } from '../../common';
import type { InteractionCreateBodyRequest, InteractionMessageUpdateBodyRequest } from '../../common/types/write';
import { ChatInputCommandInteraction } from '../../structures';
import { BaseContext } from '../basecontext';
import type { RegisteredMiddlewares } from '../decorators';
import type { Command, ContextOptions, OptionsRecord, SubCommand } from './chat';
import type { CommandMetadata, ExtendContext, GlobalMetadata, UsingClient } from './shared';
import type {
	GuildMemberStructure,
	GuildStructure,
	InteractionGuildMemberStructure,
	MessageStructure,
	OptionResolverStructure,
	WebhookMessageStructure,
} from '../../client/transformers';

export interface CommandContext<T extends OptionsRecord = {}, M extends keyof RegisteredMiddlewares = never>
	extends BaseContext,
		ExtendContext {}

export class CommandContext<
	T extends OptionsRecord = {},
	M extends keyof RegisteredMiddlewares = never,
> extends BaseContext {
	message!: If<InferWithPrefix, MessageStructure | undefined, undefined>;
	interaction!: If<InferWithPrefix, ChatInputCommandInteraction | undefined, ChatInputCommandInteraction>;

	messageResponse?: If<InferWithPrefix, MessageStructure | undefined>;
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
	metadata: CommandMetadata<UnionToTuple<M>> = {} as never;
	globalMetadata: GlobalMetadata = {};

	get proxy() {
		return this.client.proxy;
	}

	get t() {
		return this.client.t(this.interaction?.locale ?? this.client.langs?.defaultLang ?? 'en-US');
	}

	get fullCommandName() {
		return this.resolver.fullCommandName;
	}

	async write<FR extends boolean = false>(
		body: InteractionCreateBodyRequest,
		fetchReply?: FR,
	): Promise<When<FR, WebhookMessageStructure | MessageStructure, void | WebhookMessageStructure | MessageStructure>> {
		if (this.interaction) return this.interaction.write(body, fetchReply);
		const options = (this.client as Client | WorkerClient).options?.commands;
		return (this.messageResponse = await (this.message! as Message)[
			!this.messageResponse && options?.reply?.(this) ? 'reply' : 'write'
		](body));
	}

	async deferReply(ephemeral = false) {
		if (this.interaction) return this.interaction.deferReply(ephemeral ? MessageFlags.Ephemeral : undefined);
		const options = (this.client as Client | WorkerClient).options?.commands;
		return (this.messageResponse = await (this.message! as Message)[options?.reply?.(this) ? 'reply' : 'write'](
			options?.deferReplyResponse?.(this) ?? { content: 'Thinking...' },
		));
	}

	async editResponse(body: InteractionMessageUpdateBodyRequest) {
		if (this.interaction) return this.interaction.editResponse(body);
		return (this.messageResponse = await this.messageResponse!.edit(body));
	}

	deleteResponse() {
		if (this.interaction) return this.interaction.deleteResponse();
		return this.messageResponse!.delete();
	}

	editOrReply<FR extends boolean = false>(
		body: InteractionCreateBodyRequest | InteractionMessageUpdateBodyRequest,
		fetchReply?: FR,
	): Promise<When<FR, WebhookMessageStructure | MessageStructure, void | WebhookMessageStructure | MessageStructure>> {
		if (this.interaction) return this.interaction.editOrReply(body as InteractionCreateBodyRequest, fetchReply);
		if (this.messageResponse) {
			return this.editResponse(body);
		}
		return this.write(body as InteractionCreateBodyRequest, fetchReply);
	}

	async fetchResponse(): Promise<
		If<InferWithPrefix, WebhookMessageStructure | MessageStructure | undefined, WebhookMessageStructure | undefined>
	> {
		if (this.interaction) return this.interaction.fetchResponse();
		this.messageResponse = await this.messageResponse?.fetch();
		return this.messageResponse as undefined;
	}

	channel(mode?: 'rest' | 'flow'): Promise<If<InferWithPrefix, AllChannels | undefined, AllChannels>>;
	channel(mode?: 'cache'): ReturnCache<If<InferWithPrefix, AllChannels | undefined, AllChannels>>;
	channel(mode: 'cache' | 'rest' | 'flow' = 'cache') {
		if (this.interaction?.channel && mode === 'cache')
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

	me(mode?: 'rest' | 'flow'): Promise<GuildMemberStructure>;
	me(mode?: 'cache'): ReturnCache<GuildMemberStructure | undefined>;
	me(mode: 'cache' | 'rest' | 'flow' = 'cache') {
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

	guild(mode?: 'rest' | 'flow'): Promise<GuildStructure<'cached' | 'api'> | undefined>;
	guild(mode?: 'cache'): ReturnCache<GuildStructure<'cached'> | undefined>;
	guild(mode: 'cache' | 'rest' | 'flow' = 'cache') {
		if (!this.guildId)
			return (mode === 'cache'
				? this.client.cache.adapter.isAsync
					? Promise.resolve()
					: undefined
				: Promise.resolve()) as unknown as undefined;
		switch (mode) {
			case 'cache':
				return (
					this.client.cache.guilds?.get(this.guildId) ||
					(this.client.cache.adapter.isAsync ? (Promise.resolve() as any) : undefined)
				);
			default:
				return this.client.guilds.fetch(this.guildId, mode === 'rest');
		}
	}

	get guildId() {
		return this.interaction?.guildId || (this.message! as MessageStructure | undefined)?.guildId;
	}

	get channelId() {
		return this.interaction?.channelId || (this.message! as MessageStructure).channelId;
	}

	get author() {
		return this.interaction?.user || (this.message! as MessageStructure).author;
	}

	get member(): If<
		InferWithPrefix,
		GuildMemberStructure | InteractionGuildMemberStructure | undefined,
		InteractionGuildMemberStructure | undefined
	> {
		return this.interaction?.member || ((this.message! as MessageStructure)?.member as any);
	}

	isChat(): this is CommandContext {
		return true;
	}
}
