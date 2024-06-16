import type {
	APIBan,
	RESTGetAPIGuildBansQuery,
	RESTPostAPIGuildBulkBanJSONBody,
	RESTPutAPIGuildBanJSONBody,
} from 'discord-api-types/v10';
import { BaseShorter } from './base';
import { Transformers } from '../../client/transformers';

export class BanShorter extends BaseShorter {
	/**
	 * Bulk creates bans in the guild.
	 * @param guildId The ID of the guild.
	 * @param body The request body for bulk banning members.
	 * @param reason The reason for bulk banning members.
	 */
	async bulkCreate(guildId: string, body: RESTPostAPIGuildBulkBanJSONBody, reason?: string) {
		const bans = await this.client.proxy.guilds(guildId)['bulk-bans'].post({ reason, body });
		for (const id of bans.banned_users) this.client.cache.members?.removeIfNI('GuildBans', id, guildId);
		return bans;
	}

	/**
	 * Unbans a member from the guild.
	 * @param guildId The ID of the guild.
	 * @param memberId The ID of the member to unban.
	 * @param reason The reason for unbanning the member.
	 */
	async remove(guildId: string, memberId: string, reason?: string) {
		await this.client.proxy.guilds(guildId).bans(memberId).delete({ reason });
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
		await this.client.cache.members?.removeIfNI('GuildBans', memberId, guildId);
	}

	/**
	 * Fetches a ban from the guild.
	 * @param guildId The ID of the guild.
	 * @param userId The ID of the user to fetch.
	 * @param force Whether to force fetching the ban from the API even if it exists in the cache.
	 * @returns A Promise that resolves to the fetched ban.
	 */
	async fetch(guildId: string, userId: string, force = false) {
		let ban;
		if (!force) {
			ban = await this.client.cache.bans?.get(userId, guildId);
			if (ban) return ban;
		}

		ban = await this.client.proxy.guilds(guildId).bans(userId).get();
		await this.client.cache.members?.set(ban.user!.id, guildId, ban);
		return Transformers.GuildBan(this.client, ban, guildId);
	}

	/**
	 * Lists bans in the guild based on the provided query.
	 * @param guildId The ID of the guild.
	 * @param query The query parameters for listing bans.
	 * @param force Whether to force listing bans from the API even if they exist in the cache.
	 * @returns A Promise that resolves to an array of listed bans.
	 */
	async list(guildId: string, query?: RESTGetAPIGuildBansQuery, force = false) {
		let bans;
		if (!force) {
			bans = (await this.client.cache.bans?.values(guildId)) ?? [];
			if (bans.length) return bans;
		}
		bans = await this.client.proxy.guilds(guildId).bans.get({
			query,
		});
		await this.client.cache.bans?.set(
			bans.map<[string, APIBan]>(x => [x.user!.id, x]),
			guildId,
		);
		return bans.map(m => Transformers.GuildBan(this.client, m, guildId));
	}
}
