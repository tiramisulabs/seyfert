import {
	type APIGuildMember,
	type RESTGetAPIGuildMembersQuery,
	type RESTGetAPIGuildMembersSearchQuery,
	type RESTPatchAPIGuildMemberJSONBody,
	type RESTPutAPIGuildBanJSONBody,
	type RESTPutAPIGuildMemberJSONBody,
	FormattingPatterns,
} from '../../types';
import { PermissionsBitField } from '../../structures/extra/Permissions';
import type { GuildMemberResolvable } from '../types/resolvables';
import { BaseShorter } from './base';
import { Transformers } from '../../client/transformers';
import { VoiceState } from '../../structures';

export class MemberShorter extends BaseShorter {
	/**
	 * Resolves a member in the guild based on the provided GuildMemberResolvable.
	 * @param guildId The ID of the guild.
	 * @param resolve The GuildMemberResolvable to resolve.
	 * @returns A Promise that resolves to the resolved member.
	 */
	async resolve(guildId: string, resolve: GuildMemberResolvable) {
		if (typeof resolve === 'string') {
			const match: { id?: string } | undefined = resolve.match(FormattingPatterns.User)?.groups;
			if (match?.id) {
				return this.fetch(guildId, match.id);
			}
			if (resolve.match(/\d{17,20}/)) {
				return this.fetch(guildId, resolve);
			}
			return this.search(guildId, { query: resolve, limit: 1 }).then(x => x[0]);
		}

		const id = 'id' in resolve ? resolve.id : resolve.user?.id;

		if (id) {
			return this.client.members.fetch(guildId, id);
		}

		const displayName = 'displayName' in resolve ? resolve.displayName : resolve.nick ?? resolve.user?.username;

		return displayName ? this.search(guildId, { query: displayName, limit: 1 }).then(x => x[0]) : undefined;
	}

	/**
	 * Searches for members in the guild based on the provided query.
	 * @param guildId The ID of the guild.
	 * @param query The query parameters for searching members.
	 * @returns A Promise that resolves to an array of matched members.
	 */
	async search(guildId: string, query?: RESTGetAPIGuildMembersSearchQuery) {
		const members = await this.client.proxy.guilds(guildId).members.search.get({
			query,
		});
		await this.client.cache.members?.set(
			members.map(x => [x.user!.id, x]),
			guildId,
		);
		return members.map(m => Transformers.GuildMember(this.client, m, m.user!, guildId));
	}

	/**
	 * Unbans a member from the guild.
	 * @param guildId The ID of the guild.
	 * @param memberId The ID of the member to unban.
	 * @param body The request body for unbanning the member.
	 * @param reason The reason for unbanning the member.
	 */
	async unban(guildId: string, memberId: string, body?: RESTPutAPIGuildBanJSONBody, reason?: string) {
		await this.client.proxy.guilds(guildId).bans(memberId).delete({ reason, body });
	}

	/**
	 * Bans a member from the guild.
	 * @param guildId The ID of the guild.
	 * @param memberId The ID of the member to ban.
	 * @param body The request body for banning the member.
	 * @param reason The reason for banning the member.
	 */
	async ban(guildId: string, memberId: string, body?: RESTPutAPIGuildBanJSONBody, reason?: string) {
		await this.client.proxy.guilds(guildId).bans(memberId).put({ reason, body });
		await this.client.cache.members?.removeIfNI('GuildBans', memberId, guildId);
	}

	/**
	 * Kicks a member from the guild.
	 * @param guildId The ID of the guild.
	 * @param memberId The ID of the member to kick.
	 * @param reason The reason for kicking the member.
	 */
	async kick(guildId: string, memberId: string, reason?: string) {
		await this.client.proxy.guilds(guildId).members(memberId).delete({ reason });
		await this.client.cache.members?.removeIfNI('GuildMembers', memberId, guildId);
	}

	/**
	 * Edits a member in the guild.
	 * @param guildId The ID of the guild.
	 * @param memberId The ID of the member to edit.
	 * @param body The data to update the member with.
	 * @param reason The reason for editing the member.
	 * @returns A Promise that resolves to the edited member.
	 */
	async edit(guildId: string, memberId: string, body: RESTPatchAPIGuildMemberJSONBody, reason?: string) {
		const member = await this.client.proxy.guilds(guildId).members(memberId).patch({ body, reason });
		await this.client.cache.members?.setIfNI('GuildMembers', memberId, guildId, member);
		return Transformers.GuildMember(this.client, member, member.user!, guildId);
	}

	/**
	 * Adds a member to the guild.
	 * @param guildId The ID of the guild.
	 * @param memberId The ID of the member to add.
	 * @param body The request body for adding the member.
	 * @returns A Promise that resolves to the added member.
	 */
	async add(guildId: string, memberId: string, body: RESTPutAPIGuildMemberJSONBody) {
		const member = await this.client.proxy.guilds(guildId).members(memberId).put({
			body,
		});

		// Thanks dapi-types, fixed
		if (!member) {
			return;
		}

		await this.client.cache.members?.setIfNI('GuildMembers', member.user!.id, guildId, member);

		return Transformers.GuildMember(this.client, member, member.user!, guildId);
	}

	/**
	 * Fetches a member from the guild.
	 * @param guildId The ID of the guild.
	 * @param memberId The ID of the member to fetch.
	 * @param force Whether to force fetching the member from the API even if it exists in the cache.
	 * @returns A Promise that resolves to the fetched member.
	 */
	async fetch(guildId: string, memberId: string, force = false) {
		const member = await this.raw(guildId, memberId, force);
		return Transformers.GuildMember(this.client, member, member.user, guildId);
	}

	async raw(guildId: string, memberId: string, force = false) {
		let member;
		if (!force) {
			member = await this.client.cache.members?.raw(memberId, guildId);
			if (member) return member;
		}

		member = await this.client.proxy.guilds(guildId).members(memberId).get();
		await this.client.cache.members?.set(member.user.id, guildId, member);
		return member;
	}

	/**
	 * Lists members in the guild based on the provided query.
	 * @param guildId The ID of the guild.
	 * @param query The query parameters for listing members.
	 * @param force Whether to force listing members from the API even if they exist in the cache.
	 * @returns A Promise that resolves to an array of listed members.
	 */
	async list(guildId: string, query?: RESTGetAPIGuildMembersQuery, force = false) {
		let members;
		if (!force) {
			members = (await this.client.cache.members?.values(guildId)) ?? [];
			if (members.length) return members;
		}
		members = await this.client.proxy.guilds(guildId).members.get({
			query,
		});
		await this.client.cache.members?.set(members.map(x => [x.user!.id, x]) as [string, APIGuildMember][], guildId);
		return members.map(m => Transformers.GuildMember(this.client, m, m.user!, guildId));
	}

	/**
	 * Adds a role to a guild member.
	 * @param guildId The ID of the guild.
	 * @param memberId The ID of the member to add the role to.
	 * @param id The ID of the role to add.
	 */
	addRole(guildId: string, memberId: string, id: string) {
		this.client.proxy.guilds(guildId).members(memberId).roles(id).put({});
	}
	/**
	 * Removes a role from a guild member.
	 * @param guildId The ID of the guild.
	 * @param memberId The ID of the member to remove the role from.
	 * @param id The ID of the role to remove.
	 */
	removeRole(guildId: string, memberId: string, id: string) {
		return this.client.proxy.guilds(guildId).members(memberId).roles(id).delete();
	}

	async listRoles(guildId: string, memberId: string, force = false) {
		if (!force) {
			const member = await this.client.cache.members?.get(memberId, guildId);
			if (member) {
				const roles = (await this.client.cache.roles?.bulk(member.roles.keys)) ?? [];
				if (roles.length) return roles;
			}
		}

		const member = await this.client.members.fetch(guildId, memberId, force);
		const allRoles = await this.client.roles.list(guildId, force);
		const rolesId = member.roles.keys.concat(guildId);
		return allRoles.filter(role => rolesId.includes(role.id));
	}

	async sortRoles(guildId: string, memberId: string, force = false) {
		const roles = await this.listRoles(guildId, memberId, force);
		return roles.sort((a, b) => b.position - a.position);
	}

	async permissions(guildId: string, memberId: string, force = false) {
		const roles = await this.listRoles(guildId, memberId, force);

		return new PermissionsBitField(roles.map(x => BigInt(x.permissions.bits)));
	}

	presence(memberId: string) {
		return this.client.cache.presences?.get(memberId);
	}

	async voice(guildId: string, memberId: '@me', force?: boolean): Promise<VoiceState>;
	async voice(guildId: string, memberId: string, force?: boolean): Promise<VoiceState>;
	async voice(guildId: string, memberId: string | '@me', force = false) {
		if (!force) {
			const state = await this.client.cache.voiceStates?.get(memberId, guildId);
			if (state) return state;
		}

		const state = await this.client.proxy.guilds(guildId)['voice-states'](memberId).get();
		await this.client.cache.voiceStates?.setIfNI('GuildVoiceStates', memberId, guildId, state);
		return new VoiceState(this.client, state);
	}

	/**
	 * Timeouts a member from the guild.
	 * @param guildId The ID of the guild.
	 * @param memberId The ID of the member to timeout.
	 * @param time The time in seconds to timeout the member for.
	 * @param reason The reason for the timeout.
	 */
	timeout(guildId: string, memberId: string, time: number | null, reason?: string) {
		return this.edit(
			guildId,
			memberId,
			{
				communication_disabled_until: time ? new Date(Date.now() + time * 1000).toISOString() : null,
			},
			reason,
		);
	}

	/**
	 * Checks if a member has a timeout.
	 * @param member The member to check.
	 * @returns The time left until the timeout expires, in milliseconds, or false if the member does not have a timeout.
	 */
	hasTimeout(member: Exclude<GuildMemberResolvable, string>): false | number {
		// @ts-expect-error
		const timeout = member.communication_disabled_until ?? member.communicationDisabledUntil;

		if (!timeout) return false;

		const parsed = Date.parse(timeout);
		const now = Date.now();
		if (parsed > now) return parsed - now;
		return false;
	}
}

const me = '@me' as const;

export type MemberOrMe = `#${string}` | typeof me;
