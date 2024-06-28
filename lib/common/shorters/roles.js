"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoleShorter = void 0;
const base_1 = require("./base");
const transformers_1 = require("../../client/transformers");
class RoleShorter extends base_1.BaseShorter {
    /**
     * Creates a new role in the guild.
     * @param guildId The ID of the guild.
     * @param body The data for creating the role.
     * @param reason The reason for creating the role.
     * @returns A Promise that resolves when the role is created.
     */
    async create(guildId, body, reason) {
        const res = await this.client.proxy.guilds(guildId).roles.post({ body, reason });
        await this.client.cache.roles?.setIfNI('Guilds', res.id, guildId, res);
        return transformers_1.Transformers.GuildRole(this.client, res, guildId);
    }
    /**
     * Retrieves a list of roles in the guild.
     * @param guildId The ID of the guild.
     * @param force Whether to force fetching roles from the API even if they exist in the cache.
     * @returns A Promise that resolves to an array of roles.
     */
    async list(guildId, force = false) {
        const roles = await this.listRaw(guildId, force);
        return roles.map(r => transformers_1.Transformers.GuildRole(this.client, r, guildId));
    }
    async listRaw(guildId, force = false) {
        let roles = [];
        if (!force) {
            const cachedRoles = (await this.client.cache.roles?.valuesRaw(guildId)) ?? [];
            if (cachedRoles.length) {
                return cachedRoles;
            }
        }
        roles = await this.client.proxy.guilds(guildId).roles.get();
        await this.client.cache.roles?.set(roles.map(r => [r.id, r]), guildId);
        return roles;
    }
    /**
     * Edits a role in the guild.
     * @param guildId The ID of the guild.
     * @param roleId The ID of the role to edit.
     * @param body The data to update the role with.
     * @param reason The reason for editing the role.
     * @returns A Promise that resolves when the role is edited.
     */
    async edit(guildId, roleId, body, reason) {
        const res = await this.client.proxy.guilds(guildId).roles(roleId).patch({ body, reason });
        await this.client.cache.roles?.setIfNI('Guilds', roleId, guildId, res);
        return transformers_1.Transformers.GuildRole(this.client, res, guildId);
    }
    /**
     * Deletes a role from the guild.
     * @param guildId The ID of the guild.
     * @param roleId The ID of the role to delete.
     * @param reason The reason for deleting the role.
     * @returns A Promise that resolves when the role is deleted.
     */
    async delete(guildId, roleId, reason) {
        const res = await this.client.proxy.guilds(guildId).roles(roleId).delete({ reason });
        this.client.cache.roles?.removeIfNI('Guilds', roleId, guildId);
        return transformers_1.Transformers.GuildRole(this.client, res, guildId);
    }
    /**
     * Edits the positions of roles in the guild.
     * @param guildId The ID of the guild.
     * @param body The data to update the positions of roles with.
     * @returns A Promise that resolves to an array of edited roles.
     */
    async editPositions(guildId, body) {
        const roles = await this.client.proxy.guilds(guildId).roles.patch({
            body,
        });
        if (!this.client.cache.hasRolesIntent) {
            await this.client.cache.roles?.set(roles.map(x => [x.id, x]), guildId);
        }
        return roles.map(x => transformers_1.Transformers.GuildRole(this.client, x, guildId));
    }
}
exports.RoleShorter = RoleShorter;
