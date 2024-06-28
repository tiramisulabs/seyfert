import type { APIPartialEmoji } from 'discord-api-types/v10';
import type { Cache } from '../../cache';
import type { TypeArray } from '../../common';
import type { EmojiResolvable } from '../../common/types/resolvables';
/** * Convert a timestamp to a snowflake. * @param timestamp The timestamp to convert. * @returns The snowflake. */
export declare function snowflakeToTimestamp(id: string): bigint;
export declare function channelLink(channelId: string, guildId?: string): string;
export declare function messageLink(channelId: string, messageId: string, guildId?: string): string;
export declare function resolvePartialEmoji(emoji: EmojiResolvable): APIPartialEmoji | undefined;
export declare function resolveEmoji(emoji: EmojiResolvable, cache: Cache): Promise<APIPartialEmoji | undefined>;
export declare function encodeEmoji(rawEmoji: APIPartialEmoji): string;
export declare function hasProps<T extends Record<any, any>>(target: T, props: TypeArray<keyof T>): boolean;
