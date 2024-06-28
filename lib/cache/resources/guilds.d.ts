import type { APIGuild, GatewayGuildCreateDispatchData } from 'discord-api-types/v10';
import type { ReturnCache } from '..';
import { BaseResource } from './default/base';
import { type GuildStructure } from '../../client/transformers';
export declare class Guilds extends BaseResource<any, APIGuild | GatewayGuildCreateDispatchData> {
    namespace: string;
    filter(data: APIGuild, id: string): boolean;
    raw(id: string): ReturnCache<APIGuild | undefined>;
    get(id: string): ReturnCache<GuildStructure<'cached'> | undefined>;
    bulk(ids: string[]): ReturnCache<GuildStructure<'cached'>[]>;
    values(): ReturnCache<GuildStructure<'cached'>[]>;
    remove(id: string): Promise<void>;
    set(id: string, data: any): Promise<void>;
    patch(id: string, data: any): Promise<void>;
}
