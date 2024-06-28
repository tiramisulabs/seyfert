import type { APIRole, RESTPatchAPIGuildRoleJSONBody, RESTPatchAPIGuildRolePositionsJSONBody, RESTPostAPIGuildRoleJSONBody } from 'discord-api-types/v10';
import { BaseShorter } from './base';
export declare class RoleShorter extends BaseShorter {
    /**
     * Creates a new role in the guild.
     * @param guildId The ID of the guild.
     * @param body The data for creating the role.
     * @param reason The reason for creating the role.
     * @returns A Promise that resolves when the role is created.
     */
    create(guildId: string, body: RESTPostAPIGuildRoleJSONBody, reason?: string): Promise<import("../..").GuildRole>;
    /**
     * Retrieves a list of roles in the guild.
     * @param guildId The ID of the guild.
     * @param force Whether to force fetching roles from the API even if they exist in the cache.
     * @returns A Promise that resolves to an array of roles.
     */
    list(guildId: string, force?: boolean): Promise<import("../..").GuildRole[]>;
    listRaw(guildId: string, force?: boolean): Promise<APIRole[]>;
    /**
     * Edits a role in the guild.
     * @param guildId The ID of the guild.
     * @param roleId The ID of the role to edit.
     * @param body The data to update the role with.
     * @param reason The reason for editing the role.
     * @returns A Promise that resolves when the role is edited.
     */
    edit(guildId: string, roleId: string, body: RESTPatchAPIGuildRoleJSONBody, reason?: string): Promise<import("../..").GuildRole>;
    /**
     * Deletes a role from the guild.
     * @param guildId The ID of the guild.
     * @param roleId The ID of the role to delete.
     * @param reason The reason for deleting the role.
     * @returns A Promise that resolves when the role is deleted.
     */
    delete(guildId: string, roleId: string, reason?: string): Promise<import("../..").GuildRole>;
    /**
     * Edits the positions of roles in the guild.
     * @param guildId The ID of the guild.
     * @param body The data to update the positions of roles with.
     * @returns A Promise that resolves to an array of edited roles.
     */
    editPositions(guildId: string, body: RESTPatchAPIGuildRolePositionsJSONBody): Promise<import("../..").GuildRole[]>;
}
