import { CacheFrom } from '../../cache';
import { type GuildRoleStructure, Transformers } from '../../client/transformers';
import type {
	APIRole,
	RESTPatchAPIGuildRoleJSONBody,
	RESTPatchAPIGuildRolePositionsJSONBody,
	RESTPostAPIGuildRoleJSONBody,
} from '../../types';
import { BaseShorter } from './base';

export class RoleShorter extends BaseShorter {
	/**
	 * Creates a new role in the guild.
	 * @param guildId The ID of the guild.
	 * @param body The data for creating the role.
	 * @param reason The reason for creating the role.
	 * @returns A Promise that resolves when the role is created.
	 */
	async create(guildId: string, body: RESTPostAPIGuildRoleJSONBody, reason?: string): Promise<GuildRoleStructure> {
		const res = await this.client.proxy.guilds(guildId).roles.post({ body, reason });
		await this.client.cache.roles?.setIfNI(CacheFrom.Rest, 'Guilds', res.id, guildId, res);
		return Transformers.GuildRole(this.client, res, guildId);
	}

	async fetch(guildId: string, roleId: string, force = false): Promise<GuildRoleStructure> {
		const role = await this.raw(guildId, roleId, force);
		return Transformers.GuildRole(this.client, role, guildId);
	}

	async raw(guildId: string, roleId: string, force = false) {
		let role: APIRole | undefined;
		if (!force) {
			role = await this.client.cache.roles?.raw(roleId);
			if (role) return role;
		}
		role = await this.client.proxy.guilds(guildId).roles(roleId).get();
		await this.client.cache.roles?.set(CacheFrom.Rest, roleId, guildId, role);
		return role;
	}

	/**
	 * Retrieves a list of roles in the guild.
	 * @param guildId The ID of the guild.
	 * @param force Whether to force fetching roles from the API even if they exist in the cache.
	 * @returns A Promise that resolves to an array of roles.
	 */
	async list(guildId: string, force = false): Promise<GuildRoleStructure[]> {
		const roles = await this.listRaw(guildId, force);
		return roles.map(r => Transformers.GuildRole(this.client, r, guildId));
	}

	async listRaw(guildId: string, force = false) {
		let roles: APIRole[] = [];
		if (!force) {
			const cachedRoles = (await this.client.cache.roles?.valuesRaw(guildId)) ?? [];
			if (cachedRoles.length) {
				return cachedRoles;
			}
		}
		roles = await this.client.proxy.guilds(guildId).roles.get();
		await this.client.cache.roles?.set(
			CacheFrom.Rest,
			roles.map<[string, APIRole]>(r => [r.id, r]),
			guildId,
		);
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
	async edit(
		guildId: string,
		roleId: string,
		body: RESTPatchAPIGuildRoleJSONBody,
		reason?: string,
	): Promise<GuildRoleStructure> {
		const res = await this.client.proxy.guilds(guildId).roles(roleId).patch({ body, reason });
		await this.client.cache.roles?.setIfNI(CacheFrom.Rest, 'Guilds', roleId, guildId, res);
		return Transformers.GuildRole(this.client, res, guildId);
	}

	/**
	 * Deletes a role from the guild.
	 * @param guildId The ID of the guild.
	 * @param roleId The ID of the role to delete.
	 * @param reason The reason for deleting the role.
	 * @returns A Promise that resolves when the role is deleted.
	 */
	async delete(guildId: string, roleId: string, reason?: string): Promise<GuildRoleStructure> {
		const res = await this.client.proxy.guilds(guildId).roles(roleId).delete({ reason });
		this.client.cache.roles?.removeIfNI('Guilds', roleId, guildId);
		return Transformers.GuildRole(this.client, res, guildId);
	}

	/**
	 * Edits the positions of roles in the guild.
	 * @param guildId The ID of the guild.
	 * @param body The data to update the positions of roles with.
	 * @returns A Promise that resolves to an array of edited roles.
	 */
	async editPositions(guildId: string, body: RESTPatchAPIGuildRolePositionsJSONBody): Promise<GuildRoleStructure[]> {
		const roles = await this.client.proxy.guilds(guildId).roles.patch({
			body,
		});
		if (!this.client.cache.hasRolesIntent) {
			await this.client.cache.roles?.set(
				CacheFrom.Rest,
				roles.map(x => [x.id, x] as [string, any]),
				guildId,
			);
		}
		return roles.map(x => Transformers.GuildRole(this.client, x, guildId));
	}
}
