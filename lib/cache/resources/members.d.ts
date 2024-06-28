import type { APIGuildMember } from 'discord-api-types/v10';
import type { ReturnCache } from '../..';
import { GuildBasedResource } from './default/guild-based';
import { type GuildMemberStructure } from '../../client/transformers';
export declare class Members extends GuildBasedResource<any, APIGuildMember> {
    namespace: string;
    filter(data: APIGuildMember, id: string, guild_id: string): boolean;
    parse(data: any, key: string, guild_id: string): any;
    raw(id: string, guild: string): ReturnCache<APIGuildMember | undefined>;
    get(id: string, guild: string): ReturnCache<GuildMemberStructure | undefined>;
    bulk(ids: string[], guild: string): ReturnCache<GuildMemberStructure[]>;
    values(guild: string): ReturnCache<GuildMemberStructure[]>;
    set(memberId: string, guildId: string, data: any): Promise<void>;
    set(memberId_dataArray: [string, any][], guildId: string): Promise<void>;
}
