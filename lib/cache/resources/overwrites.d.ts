import type { APIOverwrite } from 'discord-api-types/v10';
import type { ReturnCache } from '../..';
import { PermissionsBitField } from '../../structures/extra/Permissions';
import { GuildRelatedResource } from './default/guild-related';
export declare class Overwrites extends GuildRelatedResource<any, APIOverwrite[]> {
    namespace: string;
    filter(data: APIOverwrite[], id: string, guild_id?: string): boolean;
    parse(data: any[], _id: string, guild_id: string): any[];
    raw(id: string): ReturnCache<(APIOverwrite & {
        guild_id: string;
    })[]>;
    get(id: string): ReturnCache<{
        type: number;
        id: string;
        deny: PermissionsBitField;
        allow: PermissionsBitField;
        guildId: string;
    }[] | undefined>;
    values(guild: string): ReturnCache<{
        type: number;
        id: string;
        deny: PermissionsBitField;
        allow: PermissionsBitField;
        guildId: string;
    }[][]>;
    bulk(ids: string[]): ReturnCache<{
        type: number;
        id: string;
        deny: PermissionsBitField;
        allow: PermissionsBitField;
    }[][]>;
}
