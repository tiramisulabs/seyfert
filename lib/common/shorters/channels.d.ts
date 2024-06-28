import { type APIChannel, type RESTGetAPIChannelMessagesQuery, type RESTPatchAPIChannelJSONBody, type RESTPostAPIChannelThreadsJSONBody, type RESTPostAPIGuildForumThreadsJSONBody } from 'discord-api-types/v10';
import { type GuildRole, type GuildMember } from '../../structures';
import { type AllChannels } from '../../structures/channels';
import { PermissionsBitField } from '../../structures/extra/Permissions';
import { BaseShorter } from './base';
import { type MessageStructure } from '../../client/transformers';
export declare class ChannelShorter extends BaseShorter {
    /**
     * Fetches a channel by its ID.
     * @param id The ID of the channel to fetch.
     * @param force Whether to force fetching the channel from the API even if it exists in the cache.
     * @returns A Promise that resolves to the fetched channel.
     */
    fetch(id: string, force?: boolean): Promise<AllChannels>;
    raw(id: string, force?: boolean): Promise<APIChannel>;
    /**
     * Deletes a channel by its ID.
     * @param id The ID of the channel to delete.
     * @param optional Optional parameters for the deletion.
     * @returns A Promise that resolves to the deleted channel.
     */
    delete(id: string, optional?: ChannelShorterOptionalParams): Promise<AllChannels>;
    /**
     * Edits a channel by its ID.
     * @param id The ID of the channel to edit.
     * @param body The updated channel data.
     * @param optional Optional parameters for the editing.
     * @returns A Promise that resolves to the edited channel.
     */
    edit(id: string, body: RESTPatchAPIChannelJSONBody, optional?: ChannelShorterOptionalParams): Promise<AllChannels>;
    /**
     * Sends a typing indicator to the channel.
     * @param id The ID of the channel.
     * @returns A Promise that resolves when the typing indicator is successfully sent.
     */
    typing(id: string): Promise<void>;
    pins(channelId: string): Promise<MessageStructure[]>;
    /**
     * Pins a message in the channel.
     * @param messageId The ID of the message to pin.
     * @param channelId The ID of the channel.
     * @param reason The reason for pinning the message.
     * @returns A Promise that resolves when the message is successfully pinned.
     */
    setPin(messageId: string, channelId: string, reason?: string): Promise<never>;
    /**
     * Unpins a message in the channel.
     * @param messageId The ID of the message to unpin.
     * @param channelId The ID of the channel.
     * @param reason The reason for unpinning the message.
     * @returns A Promise that resolves when the message is successfully unpinned.
     */
    deletePin(messageId: string, channelId: string, reason?: string): Promise<never>;
    /**
     * Creates a new thread in the channel (only guild based channels).
     * @param channelId The ID of the parent channel.
     * @param reason The reason for unpinning the message.
     * @returns A promise that resolves when the thread is succesfully created.
     */
    thread(channelId: string, body: RESTPostAPIChannelThreadsJSONBody | RESTPostAPIGuildForumThreadsJSONBody, reason?: string): Promise<import("../../structures").ThreadChannel>;
    memberPermissions(channelId: string, member: GuildMember, checkAdmin?: boolean): Promise<PermissionsBitField>;
    overwritesFor(channelId: string, member: GuildMember): Promise<{
        everyone: {
            type: number;
            id: string;
            deny: PermissionsBitField;
            allow: PermissionsBitField;
            guildId: string;
        } | undefined;
        roles: {
            type: number;
            id: string;
            deny: PermissionsBitField;
            allow: PermissionsBitField;
            guildId: string;
        }[];
        member: {
            type: number;
            id: string;
            deny: PermissionsBitField;
            allow: PermissionsBitField;
            guildId: string;
        } | undefined;
    }>;
    rolePermissions(channelId: string, role: GuildRole, checkAdmin?: boolean): Promise<PermissionsBitField>;
    fetchMessages(channelId: string, query?: RESTGetAPIChannelMessagesQuery): Promise<import("../../structures").Message[]>;
    setVoiceStatus(channelId: string, status?: string | null): Promise<never>;
}
export type ChannelShorterOptionalParams = Partial<{
    guildId: string;
    reason: string;
}>;
