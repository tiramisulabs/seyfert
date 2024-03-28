import { MessageFlags } from 'discord-api-types/v10';
import type {
	AllChannels,
	ButtonInteraction,
	ChannelSelectMenuInteraction,
	ComponentInteraction,
	Guild,
	GuildMember,
	MentionableSelectMenuInteraction,
	Message,
	ReturnCache,
	RoleSelectMenuInteraction,
	StringSelectMenuInteraction,
	UserSelectMenuInteraction,
	WebhookMessage,
} from '..';
import type { ExtendContext, UsingClient } from '../commands';
import { BaseContext } from '../commands/basecontex';
import type { InteractionCreateBodyRequest, InteractionMessageUpdateBodyRequest, When } from '../common';

export interface ComponentContext<Type extends keyof ComponentCommandInteractionMap>
	extends BaseContext,
		ExtendContext {}

export class ComponentContext<Type extends keyof ComponentCommandInteractionMap> extends BaseContext {
	constructor(
		readonly client: UsingClient,
		public interaction: ComponentCommandInteractionMap[Type] | ComponentInteraction,
	) {
		super(client);
	}

	get proxy() {
		return this.client.proxy;
	}

	get t() {
		return this.client.langs!.get(this.interaction?.locale ?? this.client.langs?.defaultLang ?? 'en-US');
	}

	get customId() {
		return this.interaction.customId;
	}

	get write() {
		return this.interaction.write;
	}

	deferReply(ephemeral = false) {
		return this.interaction.deferReply(ephemeral ? MessageFlags.Ephemeral : undefined);
	}

	get editResponse() {
		return this.interaction.editResponse;
	}

	get update() {
		return this.interaction.update;
	}

	editOrReply<FR extends boolean = false>(
		body: InteractionCreateBodyRequest | InteractionMessageUpdateBodyRequest,
		fetchReply?: FR,
	): Promise<When<FR, WebhookMessage | Message, void | WebhookMessage | Message>> {
		return this.interaction.editOrReply(body as InteractionCreateBodyRequest, fetchReply);
	}

	deleteResponse() {
		return this.interaction.deleteResponse();
	}
	channel(mode?: 'rest' | 'flow'): Promise<AllChannels>;
	channel(mode?: 'cache'): ReturnCache<AllChannels>;
	channel(mode: 'cache' | 'rest' | 'flow' = 'cache') {
		if (this.interaction?.channel && mode === 'cache')
			return this.client.cache.adapter.isAsync ? Promise.resolve(this.interaction.channel) : this.interaction.channel;
		return this.client.channels.fetch(this.channelId, mode === 'rest');
	}

	me(mode?: 'rest' | 'flow'): Promise<GuildMember>;
	me(mode?: 'cache'): ReturnCache<GuildMember | undefined>;
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

	guild(mode?: 'rest' | 'flow'): Promise<Guild<'cached' | 'api'> | undefined>;
	guild(mode?: 'cache'): ReturnCache<Guild<'cached'> | undefined>;
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

export interface ComponentCommandInteractionMap {
	ActionRow: never;
	Button: ButtonInteraction;
	StringSelect: StringSelectMenuInteraction;
	TextInput: never;
	UserSelect: UserSelectMenuInteraction;
	RoleSelect: RoleSelectMenuInteraction;
	MentionableSelect: MentionableSelectMenuInteraction;
	ChannelSelect: ChannelSelectMenuInteraction;
}
