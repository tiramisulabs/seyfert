import type { APIEmoji } from 'discord-api-types/v10';
import type { ReturnCache } from '../..';
import { GuildRelatedResource } from './default/guild-related';
import { type GuildEmojiStructure } from '../../client/transformers';
export declare class Emojis extends GuildRelatedResource<any, APIEmoji> {
    namespace: string;
    filter(data: APIEmoji, id: string, guild_id?: string): boolean;
    get(id: string): ReturnCache<GuildEmojiStructure | undefined>;
    bulk(ids: string[]): ReturnCache<GuildEmojiStructure[]>;
    values(guild: string): ReturnCache<GuildEmojiStructure[]>;
}
