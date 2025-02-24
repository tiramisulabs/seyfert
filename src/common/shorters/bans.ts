import { CacheFrom } from '../../cache';
import { type GuildBanStructure, Transformers } from '../../client/transformers';
import type {
	APIBan,
	RESTGetAPIGuildBansQuery,
	RESTPostAPIGuildBulkBanJSONBody,
	RESTPutAPIGuildBanJSONBody,
} from '../../types';
import { BaseShorter } from './base';

export class BanShorter extends BaseShorter {
	/**
	 * Bulk creates bans in the guild.
	 * @param guildId The ID of the guild.
	 * @param body The request body for bulk banning members.
	 * @param reason The reason for bulk banning members.
	 */
	async bulkCreate(guildId: string, body: RESTPostAPIGuildBulkBanJSONBody, reason?: string) {
		const bans = await this.client.proxy.guilds(guildId)['bulk-bans'].post({ reason, body });
		await Promise.all(
			bans.banned_users.map(id => this.client.cache.members?.removeIfNI('GuildModeration', id, guildId)),
		);
		return bans;
	}

	/**
	 * Unbans a member from the guild.
	 * @param guildId The ID of the guild.
	 * @param memberId The ID of the member to unban.
	 * @param reason The reason for unbanning the member.
	 */
	remove(guildId: string, memberId: string, reason?: string) {
		return this.client.proxy.guilds(guildId).bans(memberId).delete({ reason });
	}

	/**
	 * Bans a member from the guild.
	 * @param guildId The ID of the guild.
	 * @param memberId The ID of the member to ban.
	 * @param body The request body for banning the member.
	 * @param reason The reason for banning the member.
	 */
	async create(guildId: string, memberId: string, body?: RESTPutAPIGuildBanJSONBody, reason?: string) {
		await this.client.proxy.guilds(guildId).bans(memberId).put({ reason, body });
		await this.client.cache.members?.removeIfNI('GuildModeration', memberId, guildId);
	}

	/**
	 * Fetches a ban from the guild.
	 * @param guildId The ID of the guild.
	 * @param userId The ID of the user to fetch.
	 * @param force Whether to force fetching the ban from the API even if it exists in the cache.
	 * @returns A Promise that resolves to the fetched ban.
	 */
	async fetch(guildId: string, userId: string, force = false): Promise<GuildBanStructure> {
		let ban: APIBan | GuildBanStructure | undefined;
		if (!force) {
			ban = await this.client.cache.bans?.get(userId, guildId);
			if (ban) return ban;
		}

		ban = await this.client.proxy.guilds(guildId).bans(userId).get();
		await this.client.cache.members?.set(CacheFrom.Rest, ban.user.id, guildId, ban);
		return Transformers.GuildBan(this.client, ban, guildId);
	}

	/**
	 * Lists bans in the guild based on the provided query.
	 * @param guildId The ID of the guild.
	 * @param query The query parameters for listing bans.
	 * @param force Whether to force listing bans from the API even if they exist in the cache.
	 * @returns A Promise that resolves to an array of listed bans.
	 */
	async list(guildId: string, query?: RESTGetAPIGuildBansQuery, force = false): Promise<GuildBanStructure[]> {
		if (!force) {
			const bans = await this.client.cache.bans?.values(guildId);
			if (bans?.length) return bans;
		}
		const bans = await this.client.proxy.guilds(guildId).bans.get({
			query,
		});
		await this.client.cache.bans?.set(
			CacheFrom.Rest,
			bans.map<[string, APIBan]>(x => [x.user.id, x]),
			guildId,
		);
		return bans.map(m => Transformers.GuildBan(this.client, m, guildId));
	}
}
