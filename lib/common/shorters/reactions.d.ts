import type { RESTGetAPIChannelMessageReactionUsersQuery } from 'discord-api-types/v10';
import type { EmojiResolvable } from '../types/resolvables';
import { BaseShorter } from './base';
import { type UserStructure } from '../../client/transformers';
export declare class ReactionShorter extends BaseShorter {
    add(messageId: string, channelId: string, emoji: EmojiResolvable): Promise<void>;
    delete(messageId: string, channelId: string, emoji: EmojiResolvable, userId?: string): Promise<void>;
    fetch(messageId: string, channelId: string, emoji: EmojiResolvable, query?: RESTGetAPIChannelMessageReactionUsersQuery): Promise<UserStructure[]>;
    purge(messageId: string, channelId: string, emoji?: EmojiResolvable): Promise<void>;
}
