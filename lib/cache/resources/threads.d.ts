import type { APIThreadChannel } from 'discord-api-types/v10';
import type { ReturnCache } from '../..';
import { GuildRelatedResource } from './default/guild-related';
import { type ThreadChannelStructure } from '../../client/transformers';
export declare class Threads extends GuildRelatedResource<any, APIThreadChannel> {
    namespace: string;
    filter(data: APIThreadChannel, id: string, guild_id?: string): boolean;
    get(id: string): ReturnCache<ThreadChannelStructure | undefined>;
    bulk(ids: string[]): ReturnCache<ThreadChannelStructure[]>;
    values(guild: string): ReturnCache<ThreadChannelStructure[]>;
}
