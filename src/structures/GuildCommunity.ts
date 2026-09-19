import type { ReturnCache } from '../cache';
import type { GuildOnboardingStructure, GuildStructure, GuildWelcomeScreenStructure } from '../client/transformers';
import type { UsingClient } from '../commands';
import type { ObjectToLower } from '../common';
import { toCamelCase } from '../common';
import type {
	APIGuildOnboarding,
	APIGuildOnboardingPrompt,
	APIGuildOnboardingPromptOption,
	APIGuildWelcomeScreen,
	APIGuildWelcomeScreenChannel,
	RESTPatchAPIGuildWelcomeScreenJSONBody,
	RESTPutAPIGuildOnboardingJSONBody,
} from '../types';
import { DiscordBase } from './extra/DiscordBase';

export interface GuildOnboardingPromptOptionData extends ObjectToLower<Omit<APIGuildOnboardingPromptOption, 'emoji'>> {
	emojiId?: string | null;
	emojiName?: string | null;
	emojiAnimated?: boolean | null;
}

export interface GuildOnboardingPromptData extends ObjectToLower<Omit<APIGuildOnboardingPrompt, 'options'>> {
	options: GuildOnboardingPromptOptionData[];
}

export interface GuildOnboarding extends DiscordBase, ObjectToLower<Omit<APIGuildOnboarding, 'guild_id' | 'prompts'>> {
	guildId: string;
	prompts: GuildOnboardingPromptData[];
}

export class GuildOnboarding extends DiscordBase<APIGuildOnboarding & { id: string }> {
	guildId!: string;
	prompts!: GuildOnboardingPromptData[];
	constructor(client: UsingClient, data: APIGuildOnboarding) {
		super(client, { ...data, id: data.guild_id });
		this.guildId = data.guild_id;
		this.prompts = (data.prompts ?? []).map(prompt => ({
			...toCamelCase(prompt),
			options: (prompt.options ?? []).map(option => ({
				...toCamelCase(option),
				emojiId: option.emoji?.id ?? null,
				emojiName: option.emoji?.name ?? null,
				emojiAnimated: option.emoji?.animated ?? null,
			})),
		}));
	}

	guild(mode?: 'rest' | 'flow'): Promise<GuildStructure<'cached' | 'api'>>;
	guild(mode: 'cache'): ReturnCache<GuildStructure<'cached'> | undefined>;
	guild(mode: 'cache' | 'rest' | 'flow' = 'flow'): unknown {
		switch (mode) {
			case 'cache':
				return (
					this.client.cache.guilds?.get(this.guildId) ||
					(this.client.cache.adapter.isAsync ? (Promise.resolve() as never) : undefined)
				);
			default:
				return this.client.guilds.fetch(this.guildId, mode === 'rest');
		}
	}

	fetch(): Promise<GuildOnboardingStructure> {
		return this.client.guilds.onboarding.fetch(this.guildId);
	}

	edit(body: RESTPutAPIGuildOnboardingJSONBody, reason?: string): Promise<GuildOnboardingStructure> {
		return this.client.guilds.onboarding.edit(this.guildId, body, reason);
	}
}

export interface GuildWelcomeScreenChannelData extends ObjectToLower<APIGuildWelcomeScreenChannel> {}

export interface GuildWelcomeScreen
	extends DiscordBase,
		ObjectToLower<Omit<APIGuildWelcomeScreen, 'welcome_channels'>> {
	guildId: string;
	welcomeChannels: GuildWelcomeScreenChannelData[];
}

export class GuildWelcomeScreen extends DiscordBase<APIGuildWelcomeScreen & { id: string }> {
	guildId!: string;
	welcomeChannels!: GuildWelcomeScreenChannelData[];
	constructor(client: UsingClient, data: APIGuildWelcomeScreen, guildId: string) {
		super(client, { ...data, id: guildId });
		this.guildId = guildId;
		this.welcomeChannels = (data.welcome_channels ?? []).map(channel => toCamelCase(channel));
	}

	guild(mode?: 'rest' | 'flow'): Promise<GuildStructure<'cached' | 'api'>>;
	guild(mode: 'cache'): ReturnCache<GuildStructure<'cached'> | undefined>;
	guild(mode: 'cache' | 'rest' | 'flow' = 'flow'): unknown {
		switch (mode) {
			case 'cache':
				return (
					this.client.cache.guilds?.get(this.guildId) ||
					(this.client.cache.adapter.isAsync ? (Promise.resolve() as never) : undefined)
				);
			default:
				return this.client.guilds.fetch(this.guildId, mode === 'rest');
		}
	}

	fetch(): Promise<GuildWelcomeScreenStructure> {
		return this.client.guilds.welcome.fetch(this.guildId);
	}

	edit(body: RESTPatchAPIGuildWelcomeScreenJSONBody, reason?: string): Promise<GuildWelcomeScreenStructure> {
		return this.client.guilds.welcome.edit(this.guildId, body, reason);
	}
}
