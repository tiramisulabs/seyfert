import type { APIBan, GatewayGuildBanModifyDispatchData } from 'discord-api-types/v10';
import type { ReturnCache } from '../..';
import { GuildBasedResource } from './default/guild-based';
import { type GuildBanStructure } from '../../client/transformers';
export declare class Bans extends GuildBasedResource<any, GatewayGuildBanModifyDispatchData | APIBan> {
    namespace: string;
    filter(data: APIBan, id: string, guild_id: string): boolean;
    parse(data: any, key: string, guild_id: string): any;
    get(id: string, guild: string): ReturnCache<GuildBanStructure | undefined>;
    bulk(ids: string[], guild: string): ReturnCache<GuildBanStructure[]>;
    values(guild: string): ReturnCache<GuildBanStructure[]>;
}
