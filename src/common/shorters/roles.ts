import type {
	APIRole,
	RESTPatchAPIGuildRoleJSONBody,
	RESTPatchAPIGuildRolePositionsJSONBody,
	RESTPostAPIGuildRoleJSONBody,
} from 'discord-api-types/v10';
import { GuildRole } from '../../structures';
import { BaseShorter } from './base';

export class RoleShorter extends BaseShorter {
	get roles() {
		return {
			create: (guildId: string, body: RESTPostAPIGuildRoleJSONBody, reason?: string) =>
				this.client.proxy
					.guilds(guildId)
					.roles.post({ body, reason })
					.then(res => this.client.cache.roles?.setIfNI('Guilds', res.id, guildId, res)),
			list: async (guildId: string, force = false) => {
				let roles: APIRole[] = [];
				if (!force) {
					const cachedRoles = (await this.client.cache.roles?.values(guildId)) ?? [];
					if (cachedRoles.length) {
						return cachedRoles;
					}
				}
				roles = await this.client.proxy.guilds(guildId).roles.get();
				await this.client.cache.roles?.set(
					roles.map(r => [r.id, r]),
					guildId,
				);
				return roles.map(r => new GuildRole(this.client, r, guildId));
			},
			edit: (guildId: string, roleId: string, body: RESTPatchAPIGuildRoleJSONBody, reason?: string) => {
				return this.client.proxy
					.guilds(guildId)
					.roles(roleId)
					.patch({ body, reason })
					.then(res => this.client.cache.roles?.setIfNI('Guilds', roleId, guildId, res));
			},
			delete: (guildId: string, roleId: string, reason?: string) => {
				return this.client.proxy
					.guilds(guildId)
					.roles(roleId)
					.delete({ reason })
					.then(() => this.client.cache.roles?.removeIfNI('Guilds', roleId, guildId));
			},
			editPositions: async (guildId: string, body: RESTPatchAPIGuildRolePositionsJSONBody) => {
				const roles = await this.client.proxy.guilds(guildId).roles.patch({
					body,
				});
				if (!this.client.cache.hasRolesIntent) {
					await this.client.cache.roles?.set(
						roles.map(x => [x.id, x]),
						guildId,
					);
				}
				return roles.map(x => new GuildRole(this.client, x, guildId));
			},
		};
	}
}
