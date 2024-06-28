import type { APIChannel } from 'discord-api-types/v10';
import type { AllChannels } from '../../structures';
import channelFrom from '../../structures/channels';
import type { ReturnCache } from '../index';
import { GuildRelatedResource } from './default/guild-related';
export declare class Channels extends GuildRelatedResource<any, APIChannel> {
    namespace: string;
    parse(data: APIChannel, id: string, guild_id: string): any;
    raw(id: string): ReturnCache<APIChannel | undefined>;
    get(id: string): ReturnCache<AllChannels | undefined>;
    bulk(ids: string[]): ReturnCache<ReturnType<typeof channelFrom>[]>;
    values(guild: string): ReturnCache<ReturnType<typeof channelFrom>[]>;
}
