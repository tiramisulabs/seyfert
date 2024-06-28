import type { APIRole, RESTPatchAPIGuildRoleJSONBody, RESTPatchAPIGuildRolePositionsJSONBody, RESTPostAPIGuildRoleJSONBody } from 'discord-api-types/v10';
import type { UsingClient } from '../commands';
import { type MethodContext, type ObjectToLower } from '../common';
import { DiscordBase } from './extra/DiscordBase';
import { PermissionsBitField } from './extra/Permissions';
export interface GuildRole extends DiscordBase, ObjectToLower<Omit<APIRole, 'permissions'>> {
}
export declare class GuildRole extends DiscordBase {
    readonly guildId: string;
    permissions: PermissionsBitField;
    constructor(client: UsingClient, data: APIRole, guildId: string);
    guild(force?: boolean): Promise<import("./Guild").Guild<"api">> | undefined;
    edit(body: RESTPatchAPIGuildRoleJSONBody, reason?: string): Promise<GuildRole>;
    delete(reason?: string): Promise<GuildRole>;
    toString(): `<@&${string}>`;
    static methods(ctx: MethodContext<{
        guildId: string;
    }>): {
        create: (body: RESTPostAPIGuildRoleJSONBody) => Promise<GuildRole>;
        list: (force?: boolean) => Promise<GuildRole[]>;
        edit: (roleId: string, body: RESTPatchAPIGuildRoleJSONBody, reason?: string) => Promise<GuildRole>;
        delete: (roleId: string, reason?: string) => Promise<GuildRole>;
        editPositions: (body: RESTPatchAPIGuildRolePositionsJSONBody) => Promise<GuildRole[]>;
    };
}
