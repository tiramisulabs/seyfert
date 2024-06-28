import type { APIGuildMember, RESTGetAPIGuildMembersQuery, RESTGetAPIGuildMembersSearchQuery, RESTPatchAPIGuildMemberJSONBody, RESTPutAPIGuildBanJSONBody, RESTPutAPIGuildMemberJSONBody } from 'discord-api-types/v10';
import { PermissionsBitField } from '../../structures/extra/Permissions';
import type { GuildMemberResolvable } from '../types/resolvables';
import { BaseShorter } from './base';
export declare class MemberShorter extends BaseShorter {
    /**
     * Resolves a member in the guild based on the provided GuildMemberResolvable.
     * @param guildId The ID of the guild.
     * @param resolve The GuildMemberResolvable to resolve.
     * @returns A Promise that resolves to the resolved member.
     */
    resolve(guildId: string, resolve: GuildMemberResolvable): Promise<import("../..").GuildMember | undefined>;
    /**
     * Searches for members in the guild based on the provided query.
     * @param guildId The ID of the guild.
     * @param query The query parameters for searching members.
     * @returns A Promise that resolves to an array of matched members.
     */
    search(guildId: string, query?: RESTGetAPIGuildMembersSearchQuery): Promise<import("../..").GuildMember[]>;
    /**
     * Unbans a member from the guild.
     * @param guildId The ID of the guild.
     * @param memberId The ID of the member to unban.
     * @param body The request body for unbanning the member.
     * @param reason The reason for unbanning the member.
     */
    unban(guildId: string, memberId: string, body?: RESTPutAPIGuildBanJSONBody, reason?: string): Promise<void>;
    /**
     * Bans a member from the guild.
     * @param guildId The ID of the guild.
     * @param memberId The ID of the member to ban.
     * @param body The request body for banning the member.
     * @param reason The reason for banning the member.
     */
    ban(guildId: string, memberId: string, body?: RESTPutAPIGuildBanJSONBody, reason?: string): Promise<void>;
    /**
     * Kicks a member from the guild.
     * @param guildId The ID of the guild.
     * @param memberId The ID of the member to kick.
     * @param reason The reason for kicking the member.
     */
    kick(guildId: string, memberId: string, reason?: string): Promise<void>;
    /**
     * Edits a member in the guild.
     * @param guildId The ID of the guild.
     * @param memberId The ID of the member to edit.
     * @param body The data to update the member with.
     * @param reason The reason for editing the member.
     * @returns A Promise that resolves to the edited member.
     */
    edit(guildId: string, memberId: string, body: RESTPatchAPIGuildMemberJSONBody, reason?: string): Promise<import("../..").GuildMember>;
    /**
     * Adds a member to the guild.
     * @param guildId The ID of the guild.
     * @param memberId The ID of the member to add.
     * @param body The request body for adding the member.
     * @returns A Promise that resolves to the added member.
     */
    add(guildId: string, memberId: string, body: RESTPutAPIGuildMemberJSONBody): Promise<import("../..").GuildMember | undefined>;
    /**
     * Fetches a member from the guild.
     * @param guildId The ID of the guild.
     * @param memberId The ID of the member to fetch.
     * @param force Whether to force fetching the member from the API even if it exists in the cache.
     * @returns A Promise that resolves to the fetched member.
     */
    fetch(guildId: string, memberId: string, force?: boolean): Promise<import("../..").GuildMember>;
    raw(guildId: string, memberId: string, force?: boolean): Promise<APIGuildMember>;
    /**
     * Lists members in the guild based on the provided query.
     * @param guildId The ID of the guild.
     * @param query The query parameters for listing members.
     * @param force Whether to force listing members from the API even if they exist in the cache.
     * @returns A Promise that resolves to an array of listed members.
     */
    list(guildId: string, query?: RESTGetAPIGuildMembersQuery, force?: boolean): Promise<import("../..").GuildMember[]>;
    /**
     * Adds a role to a guild member.
     * @param guildId The ID of the guild.
     * @param memberId The ID of the member to add the role to.
     * @param id The ID of the role to add.
     */
    addRole(guildId: string, memberId: string, id: string): void;
    /**
     * Removes a role from a guild member.
     * @param guildId The ID of the guild.
     * @param memberId The ID of the member to remove the role from.
     * @param id The ID of the role to remove.
     */
    removeRole(guildId: string, memberId: string, id: string): Promise<never>;
    listRoles(guildId: string, memberId: string, force?: boolean): Promise<import("../..").GuildRole[]>;
    sortRoles(guildId: string, memberId: string, force?: boolean): Promise<import("../..").GuildRole[]>;
    permissions(guildId: string, memberId: string, force?: boolean): Promise<PermissionsBitField>;
    presence(memberId: string): import("../..").ReturnCache<(Omit<import("discord-api-types/v10").GatewayPresenceUpdate, "user"> & {
        id: string;
        user_id: string;
    } & {
        guild_id: string;
    }) | undefined>;
    voice(guildId: string, memberId: string): import("../..").ReturnCache<import("../..").VoiceState | undefined>;
}
