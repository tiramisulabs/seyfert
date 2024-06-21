import { MessageFlags } from 'discord-api-types/v10';
import type { AllChannels, ModalCommand, ModalSubmitInteraction, ReturnCache } from '..';
import type { CommandMetadata, ExtendContext, GlobalMetadata, RegisteredMiddlewares, UsingClient } from '../commands';
import { BaseContext } from '../commands/basecontext';
import type {
	InteractionCreateBodyRequest,
	InteractionMessageUpdateBodyRequest,
	ModalCreateBodyRequest,
	UnionToTuple,
	When,
} from '../common';
import type {
	GuildMemberStructure,
	GuildStructure,
	MessageStructure,
	WebhookMessageStructure,
} from '../client/transformers';

export interface ModalContext extends BaseContext, ExtendContext {}

/**
 * Represents a context for interacting with components in a Discord bot.
 * @template Type - The type of component interaction.
 */
export class ModalContext<M extends keyof RegisteredMiddlewares = never> extends BaseContext {
	/**
	 * Creates a new instance of the ComponentContext class.
	 * @param client - The UsingClient instance.
	 * @param interaction - The component interaction object.
	 */
	constructor(
		readonly client: UsingClient,
		public interaction: ModalSubmitInteraction,
	) {
		super(client);
	}

	command!: ModalCommand;
	metadata: CommandMetadata<UnionToTuple<M>> = {} as never;
	globalMetadata: GlobalMetadata = {};

	get customId() {
		return this.interaction.customId;
	}

	get components() {
		return this.interaction.components;
	}

	/**
	 * Gets the language object for the interaction's locale.
	 */
	get t() {
		return this.client.t(this.interaction?.locale ?? this.client.langs?.defaultLang ?? 'en-US');
	}

	/**
	 * Writes a response to the interaction.
	 * @param body - The body of the response.
	 * @param fetchReply - Whether to fetch the reply or not.
	 */
	write<FR extends boolean = false>(body: InteractionCreateBodyRequest, fetchReply?: FR) {
		return this.interaction.write(body, fetchReply);
	}

	/**
	 * Defers the reply to the interaction.
	 * @param ephemeral - Whether the reply should be ephemeral or not.
	 */
	deferReply(ephemeral = false) {
		return this.interaction.deferReply(ephemeral ? MessageFlags.Ephemeral : undefined);
	}

	/**
	 * Edits the response of the interaction.
	 * @param body - The updated body of the response.
	 */
	editResponse(body: InteractionMessageUpdateBodyRequest) {
		return this.interaction.editResponse(body);
	}

	/**
	 * Edits the response or replies to the interaction.
	 * @param body - The body of the response or updated body of the interaction.
	 * @param fetchReply - Whether to fetch the reply or not.
	 */
	editOrReply<FR extends boolean = false>(
		body: InteractionCreateBodyRequest | InteractionMessageUpdateBodyRequest,
		fetchReply?: FR,
	): Promise<When<FR, WebhookMessageStructure | MessageStructure, void | WebhookMessageStructure | MessageStructure>> {
		return this.interaction.editOrReply(body as InteractionCreateBodyRequest, fetchReply);
	}

	/**
	 * Deletes the response of the interaction.
	 * @returns A promise that resolves when the response is deleted.
	 */
	deleteResponse() {
		return this.interaction.deleteResponse();
	}

	modal(body: ModalCreateBodyRequest) {
		//@ts-expect-error
		return this.interaction.modal(body);
	}

	/**
	 * Gets the channel of the interaction.
	 * @param mode - The mode to fetch the channel.
	 * @returns A promise that resolves to the channel.
	 */
	channel(mode?: 'rest' | 'flow'): Promise<AllChannels>;
	channel(mode?: 'cache'): ReturnCache<AllChannels>;
	channel(mode: 'cache' | 'rest' | 'flow' = 'cache') {
		if (this.interaction?.channel && mode === 'cache')
			return this.client.cache.adapter.isAsync ? Promise.resolve(this.interaction.channel) : this.interaction.channel;
		return this.client.channels.fetch(this.channelId, mode === 'rest');
	}

	/**
	 * Gets the bot member in the guild of the interaction.
	 * @param mode - The mode to fetch the member.
	 * @returns A promise that resolves to the bot member.
	 */
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

	/**
	 * Gets the guild of the interaction.
	 * @param mode - The mode to fetch the guild.
	 * @returns A promise that resolves to the guild.
	 */
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

	/**
	 * Gets the ID of the guild of the interaction.
	 */
	get guildId() {
		return this.interaction.guildId;
	}

	/**
	 * Gets the ID of the channel of the interaction.
	 */
	get channelId() {
		return this.interaction.channelId!;
	}

	/**
	 * Gets the author of the interaction.
	 */
	get author() {
		return this.interaction.user;
	}

	/**
	 * Gets the member of the interaction.
	 */
	get member() {
		return this.interaction.member;
	}

	isModal(): this is ModalContext {
		return true;
	}
}
