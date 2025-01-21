import type {
	AllChannels,
	ButtonInteraction,
	ChannelSelectMenuInteraction,
	ComponentCommand,
	MentionableSelectMenuInteraction,
	ReturnCache,
	RoleSelectMenuInteraction,
	StringSelectMenuInteraction,
	UserSelectMenuInteraction,
} from '..';
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
	ComponentInteractionMessageUpdate,
	InteractionCreateBodyRequest,
	InteractionMessageUpdateBodyRequest,
	MakeRequired,
	MessageWebhookCreateBodyRequest,
	ModalCreateBodyRequest,
	UnionToTuple,
	When,
} from '../common';
import { ComponentType, MessageFlags } from '../types';

export interface ComponentContext<
	Type extends keyof ContextComponentCommandInteractionMap = keyof ContextComponentCommandInteractionMap,
> extends BaseContext,
		ExtendContext {}

/**
 * Represents a context for interacting with components in a Discord bot.
 * @template Type - The type of component interaction.
 */
export class ComponentContext<
	Type extends keyof ContextComponentCommandInteractionMap,
	M extends keyof RegisteredMiddlewares = never,
> extends BaseContext {
	/**
	 * Creates a new instance of the ComponentContext class.
	 * @param client - The UsingClient instance.
	 * @param interaction - The component interaction object.
	 */
	constructor(
		readonly client: UsingClient,
		public interaction: ContextComponentCommandInteractionMap[Type],
	) {
		super(client);
	}

	command!: ComponentCommand;
	metadata: CommandMetadata<UnionToTuple<M>> = {} as never;
	globalMetadata: GlobalMetadata = {};

	/**
	 * Gets the language object for the interaction's locale.
	 */
	get t() {
		return this.client.t(this.interaction.locale ?? this.client.langs?.defaultLang ?? 'en-US');
	}

	/**
	 * Gets the custom ID of the interaction.
	 */
	get customId() {
		return this.interaction.customId;
	}

	/**
	 * Writes a response to the interaction.
	 * @param body - The body of the response.
	 * @param fetchReply - Whether to fetch the reply or not.
	 */
	write<FR extends boolean = false>(
		body: InteractionCreateBodyRequest,
		fetchReply?: FR,
	): Promise<When<FR, WebhookMessageStructure, void>> {
		return this.interaction.write<FR>(body, fetchReply);
	}

	/**
	 * Defers the reply to the interaction.
	 * @param ephemeral - Whether the reply should be ephemeral or not.
	 */
	deferReply<FR extends boolean = false>(
		ephemeral = false,
		fetchReply?: FR,
	): Promise<When<FR, WebhookMessageStructure, undefined>> {
		return this.interaction.deferReply<FR>(ephemeral ? MessageFlags.Ephemeral : undefined, fetchReply);
	}

	/**
	 * ACK an interaction and edit the original message later; the user does not see a loading state
	 */
	deferUpdate() {
		return this.interaction.deferUpdate();
	}

	/**
	 * Edits the response of the interaction.
	 * @param body - The updated body of the response.
	 */
	editResponse(body: InteractionMessageUpdateBodyRequest): Promise<WebhookMessageStructure> {
		return this.interaction.editResponse(body);
	}

	/**
	 * Updates the interaction with new data.
	 * @param body - The updated body of the interaction.
	 */
	update(body: ComponentInteractionMessageUpdate) {
		return this.interaction.update(body);
	}

	/**
	 * Edits the response or replies to the interaction.
	 * @param body - The body of the response or updated body of the interaction.
	 * @param fetchReply - Whether to fetch the reply or not.
	 */
	editOrReply<FR extends boolean = false>(
		body: InteractionCreateBodyRequest | InteractionMessageUpdateBodyRequest,
		fetchReply?: FR,
	): Promise<When<FR, WebhookMessageStructure, void>> {
		return this.interaction.editOrReply<FR>(body as InteractionCreateBodyRequest, fetchReply);
	}

	followup(body: MessageWebhookCreateBodyRequest): Promise<WebhookMessageStructure> {
		return this.interaction.followup(body);
	}

	/**
	 * @returns A Promise that resolves to the fetched message
	 */
	fetchResponse(): Promise<WebhookMessageStructure> {
		return this.interaction.fetchResponse();
	}

	/**
	 * Deletes the response of the interaction.
	 * @returns A promise that resolves when the response is deleted.
	 */
	deleteResponse() {
		return this.interaction.deleteResponse();
	}

	modal(body: ModalCreateBodyRequest) {
		return this.interaction.modal(body);
	}

	/**
	 * Gets the channel of the interaction.
	 * @param mode - The mode to fetch the channel.
	 * @returns A promise that resolves to the channel.
	 */
	channel(mode?: 'rest' | 'flow'): Promise<AllChannels>;
	channel(mode: 'cache'): ReturnCache<AllChannels>;
	channel(mode: 'cache' | 'rest' | 'flow' = 'flow') {
		if (mode === 'cache')
			return this.client.cache.adapter.isAsync ? Promise.resolve(this.interaction.channel) : this.interaction.channel;
		return this.client.channels.fetch(this.channelId, mode === 'rest');
	}

	/**
	 * Gets the bot member in the guild of the interaction.
	 * @param mode - The mode to fetch the member.
	 * @returns A promise that resolves to the bot member.
	 */
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

	/**
	 * Gets the guild of the interaction.
	 * @param mode - The mode to fetch the guild.
	 * @returns A promise that resolves to the guild.
	 */
	guild(mode?: 'rest' | 'flow'): Promise<GuildStructure<'cached' | 'api'> | undefined>;
	guild(mode: 'cache'): ReturnCache<GuildStructure<'cached'> | undefined>;
	guild(mode: 'cache' | 'rest' | 'flow' = 'flow') {
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
		return this.interaction.channel.id;
	}

	/**
	 * Gets the author of the interaction.
	 */
	get author(): UserStructure {
		return this.interaction.user;
	}

	/**
	 * Gets the member of the interaction.
	 */
	get member(): InteractionGuildMemberStructure | undefined {
		return this.interaction.member;
	}

	isComponent(): this is ComponentContext<keyof ContextComponentCommandInteractionMap> {
		return true;
	}

	isButton(): this is ComponentContext<'Button', M> {
		return this.interaction.data.componentType === ComponentType.Button;
	}

	isChannelSelectMenu(): this is ComponentContext<'ChannelSelect', M> {
		return this.interaction.componentType === ComponentType.ChannelSelect;
	}

	isRoleSelectMenu(): this is ComponentContext<'RoleSelect', M> {
		return this.interaction.componentType === ComponentType.RoleSelect;
	}

	isMentionableSelectMenu(): this is ComponentContext<'MentionableSelect', M> {
		return this.interaction.componentType === ComponentType.MentionableSelect;
	}

	isUserSelectMenu(): this is ComponentContext<'UserSelect', M> {
		return this.interaction.componentType === ComponentType.UserSelect;
	}

	isStringSelectMenu(): this is ComponentContext<'StringSelect', M> {
		return this.interaction.componentType === ComponentType.StringSelect;
	}

	inGuild(): this is GuildComponentContext<Type, M> {
		return !!this.guildId;
	}
}

export interface ContextComponentCommandInteractionMap {
	Button: ButtonInteraction;
	StringSelect: StringSelectMenuInteraction;
	UserSelect: UserSelectMenuInteraction;
	RoleSelect: RoleSelectMenuInteraction;
	MentionableSelect: MentionableSelectMenuInteraction;
	ChannelSelect: ChannelSelectMenuInteraction;
}

export interface GuildComponentContext<
	Type extends keyof ContextComponentCommandInteractionMap,
	M extends keyof RegisteredMiddlewares = never,
> extends Omit<MakeRequired<ComponentContext<Type, M>, 'guildId' | 'member'>, 'guild' | 'me'> {
	guild(mode?: 'rest' | 'flow'): Promise<GuildStructure<'cached' | 'api'>>;
	guild(mode: 'cache'): ReturnCache<GuildStructure<'cached'> | undefined>;

	me(mode?: 'rest' | 'flow'): Promise<GuildMemberStructure>;
	me(mode: 'cache'): ReturnCache<GuildMemberStructure | undefined>;
}
