import type { RESTGetAPIGuildBansQuery, RESTPostAPIGuildBulkBanJSONBody, RESTPutAPIGuildBanJSONBody } from 'discord-api-types/v10';
import { BaseShorter } from './base';
export declare class BanShorter extends BaseShorter {
    /**
     * Bulk creates bans in the guild.
     * @param guildId The ID of the guild.
     * @param body The request body for bulk banning members.
     * @param reason The reason for bulk banning members.
     */
    bulkCreate(guildId: string, body: RESTPostAPIGuildBulkBanJSONBody, reason?: string): Promise<import("discord-api-types/v10").RESTPostAPIGuildBulkBanResult>;
    /**
     * Unbans a member from the guild.
     * @param guildId The ID of the guild.
     * @param memberId The ID of the member to unban.
     * @param reason The reason for unbanning the member.
     */
    remove(guildId: string, memberId: string, reason?: string): Promise<void>;
    /**
     * Bans a member from the guild.
     * @param guildId The ID of the guild.
     * @param memberId The ID of the member to ban.
     * @param body The request body for banning the member.
     * @param reason The reason for banning the member.
     */
    create(guildId: string, memberId: string, body?: RESTPutAPIGuildBanJSONBody, reason?: string): Promise<void>;
    /**
     * Fetches a ban from the guild.
     * @param guildId The ID of the guild.
     * @param userId The ID of the user to fetch.
     * @param force Whether to force fetching the ban from the API even if it exists in the cache.
     * @returns A Promise that resolves to the fetched ban.
     */
    fetch(guildId: string, userId: string, force?: boolean): Promise<import("../../structures/GuildBan").GuildBan>;
    /**
     * Lists bans in the guild based on the provided query.
     * @param guildId The ID of the guild.
     * @param query The query parameters for listing bans.
     * @param force Whether to force listing bans from the API even if they exist in the cache.
     * @returns A Promise that resolves to an array of listed bans.
     */
    list(guildId: string, query?: RESTGetAPIGuildBansQuery, force?: boolean): Promise<import("../../structures/GuildBan").GuildBan[]>;
}
