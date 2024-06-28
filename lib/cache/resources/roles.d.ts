import type { APIRole } from 'discord-api-types/v10';
import type { ReturnCache } from '../..';
import { GuildRelatedResource } from './default/guild-related';
import { type GuildRoleStructure } from '../../client/transformers';
export declare class Roles extends GuildRelatedResource<any, APIRole> {
    namespace: string;
    filter(data: APIRole, id: string, guild_id?: string): boolean;
    raw(id: string): ReturnCache<APIRole | undefined>;
    get(id: string): ReturnCache<GuildRoleStructure | undefined>;
    bulk(ids: string[]): ReturnCache<GuildRoleStructure[]>;
    values(guild: string): ReturnCache<GuildRoleStructure[]>;
    valuesRaw(guild: string): ReturnCache<APIRole[]>;
}
