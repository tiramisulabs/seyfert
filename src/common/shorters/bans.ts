import { CacheFrom, type CacheListOptions } from '../../cache';
import { canPageInCache, compareSnowflakes, hasCacheQuery, selectCachePage } from '../../cache/list-query';
import { type GuildBanStructure, Transformers } from '../../client/transformers';
import type {
	APIBan,
	RESTGetAPIGuildBansQuery,
	RESTPostAPIGuildBulkBanJSONBody,
	RESTPutAPIGuildBanJSONBody,
} from '../../types';
import type { BanOptions } from '../types/options';
import { BaseShorter } from './base';

export function resolveBanOptions(options?: BanOptions): {
	body: RESTPutAPIGuildBanJSONBody | undefined;
	reason?: string;
} {
	return {
		body:
			options?.deleteMessageSeconds === undefined
				? undefined
				: { delete_message_seconds: options.deleteMessageSeconds },
		reason: options?.reason,
	};
}

export class BanShorter extends BaseShorter {
	/**
	 * Bulk creates bans in the guild.
	 * @param guildId The ID of the guild.
	 * @param body The request body for bulk banning members.
	 * @param reason The reason for bulk banning members.
	 */
	async bulkCreate(guildId: string, body: RESTPostAPIGuildBulkBanJSONBody, reason?: string) {
		const bans = await this.client.proxy.guilds(guildId)['bulk-ban'].post({ reason, body });
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
	 * @param options The options for banning the member.
	 */
	async create(guildId: string, memberId: string, options?: BanOptions) {
		await this.client.proxy.guilds(guildId).bans(memberId).put(resolveBanOptions(options));
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
		await this.client.cache.bans?.set(CacheFrom.Rest, ban.user.id, guildId, ban);
		return Transformers.GuildBan(this.client, ban, guildId);
	}

	/**
	 * Lists bans in the guild using cached pagination when enabled. With both cursors, only `before` is respected.
	 * @param guildId The ID of the guild.
	 * @param query The query parameters for listing bans.
	 * @param options Force a REST request, or override the client cache query policy. A boolean means force.
	 * @returns A Promise that resolves to an array of listed bans.
	 */
	async list(
		guildId: string,
		query?: RESTGetAPIGuildBansQuery,
		options: boolean | CacheListOptions = false,
	): Promise<GuildBanStructure[]> {
		const { force, cacheQuery } = typeof options === 'boolean' ? { force: options } : options;
		const resource = this.client.cache.bans;
		if (!force && resource) {
			if (!hasCacheQuery(query)) {
				const cached = await resource.values(guildId);
				if (cached.length) return cached;
			} else if (cacheQuery ?? this.client.cache.queries.bans) {
				// Discord respects only `before` when both cursors are sent.
				const paged = query.before === undefined ? query : { ...query, after: undefined };
				const ids = canPageInCache(paged, 1000) ? await resource.getToRelationship(guildId) : [];
				if (ids.length) {
					const page = selectCachePage(ids, paged, paged.limit ?? 1000);
					const bans = await resource.bulk(page, guildId);
					// An id that does not resolve is a hole in the cache, so Discord answers this page instead.
					if (bans.length === page.length) return bans.sort((a, b) => compareSnowflakes(a.id, b.id));
				}
			}
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
