// ho, onboarding was raw proxy only before, so this gives it a real model
// btw welcome screen lives here too cuz both are guild community surfaces
import type { ReturnCache } from '../cache';
import type { GuildOnboardingStructure, GuildStructure, GuildWelcomeScreenStructure } from '../client/transformers';
import type { UsingClient } from '../commands';
import type { MethodContext, ObjectToLower } from '../common';
import type {
	APIGuildOnboarding,
	APIGuildOnboardingPrompt,
	APIGuildOnboardingPromptOption,
	APIGuildWelcomeScreen,
	APIGuildWelcomeScreenChannel,
	RESTPatchAPIGuildWelcomeScreenJSONBody,
	RESTPutAPIGuildOnboardingJSONBody,
} from '../types';
import { Base } from './extra/Base';
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
		// hell, onboarding has no id of its own so reuse guild id here
		super(client, { ...data, id: data.guild_id });
		this.guildId = data.guild_id;
		// cuz nested prompts keep raw emoji objects, flatten them by hand
		this.prompts = (data.prompts ?? []).map(
			prompt =>
				({
					...this.patchRecord(prompt),
					options: (prompt.options ?? []).map(option => ({
						...this.patchRecord(option),
						emojiId: option.emoji?.id ?? null,
						emojiName: option.emoji?.name ?? null,
						emojiAnimated: option.emoji?.animated ?? null,
					})),
				}) as never,
		);
	}

	private patchRecord(value: object): Record<string, unknown> {
		// ho __patchThis lives on Base, borrow it on a throwaway so nested rows camelCase right
		const holder = Object.create(Base.prototype) as Base;
		return holder['__patchThis'].call(holder, value as never) as unknown as Record<string, unknown>;
	}

	// ahh quick check so bots know if members even see this flow
	get isEnabled(): boolean {
		return this.enabled;
	}

	// ho only prompts flagged for onboarding show in the actual flow
	get flowPrompts(): GuildOnboardingPromptData[] {
		return this.prompts.filter(prompt => prompt.inOnboarding);
	}

	// cuz required ones block completion, keep them easy to grab
	get requiredPrompts(): GuildOnboardingPromptData[] {
		return this.prompts.filter(prompt => prompt.required);
	}

	// btw handy for sanity checks before pushing edits
	get totalOptions(): number {
		return this.prompts.reduce((total, prompt) => total + (prompt.options?.length ?? 0), 0);
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

	// ops refetch live onboarding, local copy goes stale fast
	fetch(): Promise<GuildOnboardingStructure> {
		return this.client.guilds.onboarding.fetch(this.guildId);
	}

	// ho push a full onboarding update through, prompts included
	edit(body: RESTPutAPIGuildOnboardingJSONBody, reason?: string): Promise<GuildOnboardingStructure> {
		return this.client.guilds.onboarding.edit(this.guildId, body, reason);
	}

	static methods({ client, guildId }: MethodContext<{ guildId: string }>) {
		return {
			fetch: (): Promise<GuildOnboardingStructure> => client.guilds.onboarding.fetch(guildId),
			edit: (body: RESTPutAPIGuildOnboardingJSONBody, reason?: string): Promise<GuildOnboardingStructure> =>
				client.guilds.onboarding.edit(guildId, body, reason),
		};
	}
}


export interface GuildWelcomeScreenChannelData extends ObjectToLower<APIGuildWelcomeScreenChannel> {}

export interface GuildWelcomeScreen extends DiscordBase, ObjectToLower<Omit<APIGuildWelcomeScreen, 'welcome_channels'>> {
	guildId: string;
	welcomeChannels: GuildWelcomeScreenChannelData[];
}

export class GuildWelcomeScreen extends DiscordBase<APIGuildWelcomeScreen & { id: string }> {
	guildId!: string;
	welcomeChannels!: GuildWelcomeScreenChannelData[];
	constructor(client: UsingClient, data: APIGuildWelcomeScreen, guildId: string) {
		// hell welcome screen has no id either so reuse guild id again
		super(client, { ...data, id: guildId });
		this.guildId = guildId;
		// cuz toCamelCase on the whole thing nests weird, patch channels one by one
		this.welcomeChannels = (data.welcome_channels ?? []).map(channel => this.patchRecord(channel) as never);
	}

	private patchRecord(value: object): Record<string, unknown> {
		// ho same trick as onboarding, borrow Base on a throwaway holder
		const holder = Object.create(Base.prototype) as Base;
		return holder['__patchThis'].call(holder, value as never) as unknown as Record<string, unknown>;
	}

	// ahh empty description means Discord shows a pretty bare screen
	get hasDescription(): boolean {
		return !!this.description?.length;
	}

	// btw Discord caps suggested channels so keep the count handy
	get channelCount(): number {
		return this.welcomeChannels.length;
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

	// ops grab the fresh screen, local one might be outdated
	fetch(): Promise<GuildWelcomeScreenStructure> {
		return this.client.guilds.welcome.fetch(this.guildId);
	}

	// ho patch description plus channels plus enabled flag in one go
	edit(body: RESTPatchAPIGuildWelcomeScreenJSONBody, reason?: string): Promise<GuildWelcomeScreenStructure> {
		return this.client.guilds.welcome.edit(this.guildId, body, reason);
	}

	static methods({ client, guildId }: MethodContext<{ guildId: string }>) {
		return {
			fetch: (): Promise<GuildWelcomeScreenStructure> => client.guilds.welcome.fetch(guildId),
			edit: (body: RESTPatchAPIGuildWelcomeScreenJSONBody, reason?: string): Promise<GuildWelcomeScreenStructure> =>
				client.guilds.welcome.edit(guildId, body, reason),
		};
	}
}
