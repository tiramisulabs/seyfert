import type { GuildMemberStructure, GuildStructure } from '../client/transformers';
import type { ModalContext } from '../components';
import type { ComponentContext, ContextComponentCommandInteractionMap } from '../components/componentcontext';
import type { AllChannels, MessageCommandInteraction, UserCommandInteraction } from '../structures';
import type { RESTGetAPIGuildQuery } from '../types';
import type { CommandContext } from './applications/chatcontext';
import type { EntryPointContext } from './applications/entrycontext';
import type { MenuCommandContext } from './applications/menucontext';
import type { UsingClient } from './applications/shared';

type ContextFetchMode = 'cache' | 'rest' | 'flow';
type ContextFetchResult<T> = T | undefined | Promise<T | undefined>;

function contextCacheMiss(client: UsingClient) {
	return client.cache.adapter.isAsync ? Promise.resolve(undefined) : undefined;
}

/** @internal */
export function resolveContextChannel(
	client: UsingClient,
	channelId: string,
	mode: ContextFetchMode,
	interactionChannel?: AllChannels,
): ContextFetchResult<AllChannels> {
	if (mode !== 'cache') return client.channels.fetch(channelId, mode === 'rest');
	if (interactionChannel)
		return client.cache.adapter.isAsync ? Promise.resolve(interactionChannel) : interactionChannel;
	return client.cache.channels?.get(channelId) || contextCacheMiss(client);
}

/** @internal */
export function resolveContextMember(
	client: UsingClient,
	guildId: string | null | undefined,
	memberId: string,
	mode: ContextFetchMode,
): ContextFetchResult<GuildMemberStructure> {
	if (!guildId) return mode === 'cache' ? contextCacheMiss(client) : Promise.resolve(undefined);
	if (mode === 'cache') return client.cache.members?.get(memberId, guildId) || contextCacheMiss(client);
	return client.members.fetch(guildId, memberId, mode === 'rest');
}

/** @internal */
export function resolveContextGuild(
	client: UsingClient,
	guildId: string | null | undefined,
	mode: ContextFetchMode,
	query?: RESTGetAPIGuildQuery,
): ContextFetchResult<GuildStructure<'cached' | 'api'>> {
	if (!guildId) return mode === 'cache' ? contextCacheMiss(client) : Promise.resolve(undefined);
	if (mode === 'cache') return client.cache.guilds?.get(guildId) || contextCacheMiss(client);
	return client.guilds.fetch(guildId, { force: mode === 'rest', query });
}

export class BaseContext {
	constructor(readonly client: UsingClient) {}

	/**
	 * Gets the proxy object.
	 */
	get proxy() {
		return this.client.proxy;
	}

	isChat(): this is CommandContext {
		return false;
	}

	isMenu(): this is MenuCommandContext<UserCommandInteraction | MessageCommandInteraction> {
		return false;
	}

	isMenuUser(): this is MenuCommandContext<UserCommandInteraction> {
		return false;
	}

	isMenuMessage(): this is MenuCommandContext<MessageCommandInteraction> {
		return false;
	}

	isComponent(): this is ComponentContext<keyof ContextComponentCommandInteractionMap> {
		return false;
	}

	isModal(): this is ModalContext {
		return false;
	}

	isButton(): this is ComponentContext<'Button'> {
		return false;
	}

	isChannelSelectMenu(): this is ComponentContext<'ChannelSelect'> {
		return false;
	}

	isRoleSelectMenu(): this is ComponentContext<'RoleSelect'> {
		return false;
	}

	isMentionableSelectMenu(): this is ComponentContext<'MentionableSelect'> {
		return false;
	}

	isUserSelectMenu(): this is ComponentContext<'UserSelect'> {
		return false;
	}

	isStringSelectMenu(): this is ComponentContext<'StringSelect'> {
		return false;
	}

	isEntryPoint(): this is EntryPointContext {
		return false;
	}
}
