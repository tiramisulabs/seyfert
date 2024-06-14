import { FormattingPatterns } from 'discord-api-types/globals';
import type { APIPartialEmoji } from 'discord-api-types/v10';
import type { Cache } from '../../cache';
import type { TypeArray } from '../../common';
import { DiscordEpoch } from '../../common';
import type { EmojiResolvable } from '../../common/types/resolvables';

/** * Convert a timestamp to a snowflake. * @param timestamp The timestamp to convert. * @returns The snowflake. */
export function snowflakeToTimestamp(id: string): bigint {
	return (BigInt(id) >> 22n) + DiscordEpoch;
}

export function channelLink(channelId: string, guildId?: string) {
	return `https://discord.com/channels/${guildId ?? '@me'}/${channelId}`;
}

export function messageLink(channelId: string, messageId: string, guildId?: string) {
	return `${channelLink(channelId, guildId)}/${messageId}`;
}

export function resolvePartialEmoji(emoji: EmojiResolvable): APIPartialEmoji | undefined {
	if (typeof emoji === 'string') {
		const groups: Partial<APIPartialEmoji> | undefined = emoji.match(FormattingPatterns.Emoji)?.groups;
		if (groups) {
			return { animated: !!groups.animated, name: groups.name!, id: groups.id! };
		}
		if (emoji.includes('%')) {
			emoji = encodeURIComponent(emoji);
		}
		if (!(emoji.includes(':') || emoji.match(/\d{17,20}/g))) {
			return { name: emoji, id: null };
		}
		return;
	}

	if (!(emoji.id && emoji.name)) return;
	return { id: emoji.id, name: emoji.name, animated: !!emoji.animated };
}

export async function resolveEmoji(emoji: EmojiResolvable, cache: Cache): Promise<APIPartialEmoji | undefined> {
	const partial = resolvePartialEmoji(emoji);
	if (partial) return partial;

	if (typeof emoji === 'string') {
		if (!emoji.match(/\d{17,20}/g)) return;
		const fromCache = await cache.emojis?.get(emoji);
		return fromCache && { animated: fromCache.animated, id: fromCache.id, name: fromCache.name };
	}

	const fromCache = await cache.emojis?.get(emoji.id!);
	if (fromCache) return { animated: fromCache.animated, id: fromCache.id, name: fromCache.name };
	return;
}

export function encodeEmoji(rawEmoji: APIPartialEmoji) {
	return rawEmoji.id ? `${rawEmoji.name}:${rawEmoji.id}` : `${rawEmoji.name}`;
}

export function hasProps<T extends Record<any, any>>(target: T, props: TypeArray<keyof T>): boolean {
	if (Array.isArray(props)) {
		return props.every(x => hasProps(target, x));
	}
	if (!((props as T[number]) in target)) {
		return false;
	}
	if (typeof target[props] === 'string' && !target[props as T[number]].length) {
		return false;
	}
	return true;
}
