import type { GuildWidgetStyle, RESTGetAPICurrentUserGuildsQuery, RESTPatchAPIAutoModerationRuleJSONBody, RESTPatchAPIChannelJSONBody, RESTPatchAPIGuildChannelPositionsJSONBody, RESTPatchAPIGuildStickerJSONBody, RESTPostAPIAutoModerationRuleJSONBody, RESTPostAPIGuildChannelJSONBody, RESTPostAPIGuildsJSONBody } from 'discord-api-types/v10';
import { type ObjectToLower } from '..';
import { GuildMember, type CreateStickerBodyRequest } from '../../structures';
import { BaseShorter } from './base';
import { type GuildStructure } from '../../client/transformers';
export declare class GuildShorter extends BaseShorter {
    /**
     * Creates a new guild.
     * @param body The data for creating the guild.
     * @returns A Promise that resolves to the created guild.
     */
    create(body: RESTPostAPIGuildsJSONBody): Promise<GuildStructure<'api'>>;
    /**
     * Fetches a guild by its ID.
     * @param id The ID of the guild to fetch.
     * @param force Whether to force fetching the guild from the API even if it exists in the cache.
     * @returns A Promise that resolves to the fetched guild.
     */
    fetch(id: string, force?: boolean): Promise<import("../../structures").Guild<"api">>;
    raw(id: string, force?: boolean): Promise<import("discord-api-types/v10").APIGuild>;
    /**
     * Generates the widget URL for the guild.
     * @param id The ID of the guild.
     * @param style The style of the widget.
     * @returns The generated widget URL.
     */
    widgetURL(id: string, style?: GuildWidgetStyle): Promise<import("discord-api-types/v10").APIGuildWidgetSettings>;
    list(query?: RESTGetAPICurrentUserGuildsQuery): Promise<import("../../structures").AnonymousGuild[]>;
    fetchSelf(id: string, force?: boolean): Promise<GuildMember>;
    leave(id: string): Promise<void | undefined>;
    /**
     * Provides access to channel-related functionality in a guild.
     */
    get channels(): {
        /**
         * Retrieves a list of channels in the guild.
         * @param guildId The ID of the guild.
         * @param force Whether to force fetching channels from the API even if they exist in the cache.
         * @returns A Promise that resolves to an array of channels.
         */
        list: (guildId: string, force?: boolean) => Promise<import("../../structures").AllChannels[]>;
        /**
         * Fetches a channel by its ID.
         * @param guildId The ID of the guild.
         * @param channelId The ID of the channel to fetch.
         * @param force Whether to force fetching the channel from the API even if it exists in the cache.
         * @returns A Promise that resolves to the fetched channel.
         */
        fetch: (guildId: string, channelId: string, force?: boolean) => Promise<import("../../structures").AllChannels>;
        /**
         * Creates a new channel in the guild.
         * @param guildId The ID of the guild.
         * @param body The data for creating the channel.
         * @returns A Promise that resolves to the created channel.
         */
        create: (guildId: string, body: RESTPostAPIGuildChannelJSONBody) => Promise<import("../../structures").AllChannels>;
        /**
         * Deletes a channel from the guild.
         * @param guildId The ID of the guild.
         * @param channelId The ID of the channel to delete.
         * @param reason The reason for deleting the channel.
         * @returns A Promise that resolves to the deleted channel.
         */
        delete: (guildId: string, channelId: string, reason?: string) => Promise<import("../../structures").AllChannels>;
        /**
         * Edits a channel in the guild.
         * @param guildchannelId The ID of the guild.
         * @param channelId The ID of the channel to edit.
         * @param body The data to update the channel with.
         * @param reason The reason for editing the channel.
         * @returns A Promise that resolves to the edited channel.
         */
        edit: (guildchannelId: string, channelId: string, body: RESTPatchAPIChannelJSONBody, reason?: string) => Promise<import("../../structures").AllChannels>;
        /**
         * Edits the positions of channels in the guild.
         * @param guildId The ID of the guild.
         * @param body The data containing the new positions of channels.
         */
        editPositions: (guildId: string, body: RESTPatchAPIGuildChannelPositionsJSONBody) => Promise<never>;
        addFollower: (channelId: string, webhook_channel_id: string, reason?: string) => Promise<import("discord-api-types/v10").APIFollowedChannel>;
    };
    /**
     * Provides access to auto-moderation rule-related functionality in a guild.
     */
    get moderation(): {
        /**
         * Retrieves a list of auto-moderation rules in the guild.
         * @param guildId The ID of the guild.
         * @returns A Promise that resolves to an array of auto-moderation rules.
         */
        list: (guildId: string) => Promise<import("../../structures").AutoModerationRule[]>;
        /**
         * Creates a new auto-moderation rule in the guild.
         * @param guildId The ID of the guild.
         * @param body The data for creating the auto-moderation rule.
         * @returns A Promise that resolves to the created auto-moderation rule.
         */
        create: (guildId: string, body: RESTPostAPIAutoModerationRuleJSONBody) => Promise<import("../../structures").AutoModerationRule>;
        /**
         * Deletes an auto-moderation rule from the guild.
         * @param guildId The ID of the guild.
         * @param ruleId The ID of the rule to delete.
         * @param reason The reason for deleting the rule.
         * @returns A Promise that resolves once the rule is deleted.
         */
        delete: (guildId: string, ruleId: string, reason?: string) => Promise<never>;
        /**
         * Fetches an auto-moderation rule by its ID.
         * @param guildId The ID of the guild.
         * @param ruleId The ID of the rule to fetch.
         * @returns A Promise that resolves to the fetched auto-moderation rule.
         */
        fetch: (guildId: string, ruleId: string) => Promise<import("../../structures").AutoModerationRule>;
        /**
         * Edits an auto-moderation rule in the guild.
         * @param guildId The ID of the guild.
         * @param ruleId The ID of the rule to edit.
         * @param body The data to update the rule with.
         * @param reason The reason for editing the rule.
         * @returns A Promise that resolves to the edited auto-moderation rule.
         */
        edit: (guildId: string, ruleId: string, body: ObjectToLower<RESTPatchAPIAutoModerationRuleJSONBody>, reason?: string) => Promise<import("../../structures").AutoModerationRule>;
    };
    /**
     * Provides access to sticker-related functionality in a guild.
     */
    get stickers(): {
        /**
         * Retrieves a list of stickers in the guild.
         * @param guildId The ID of the guild.
         * @returns A Promise that resolves to an array of stickers.
         */
        list: (guildId: string) => Promise<import("../../structures").Sticker[]>;
        /**
         * Creates a new sticker in the guild.
         * @param guildId The ID of the guild.
         * @param request The request body for creating the sticker.
         * @param reason The reason for creating the sticker.
         * @returns A Promise that resolves to the created sticker.
         */
        create: (guildId: string, { file, ...json }: CreateStickerBodyRequest, reason?: string) => Promise<import("../../structures").Sticker>;
        /**
         * Edits an existing sticker in the guild.
         * @param guildId The ID of the guild.
         * @param stickerId The ID of the sticker to edit.
         * @param body The data to update the sticker with.
         * @param reason The reason for editing the sticker.
         * @returns A Promise that resolves to the edited sticker.
         */
        edit: (guildId: string, stickerId: string, body: RESTPatchAPIGuildStickerJSONBody, reason?: string) => Promise<import("../../structures").Sticker>;
        /**
         * Fetches a sticker by its ID from the guild.
         * @param guildId The ID of the guild.
         * @param stickerId The ID of the sticker to fetch.
         * @param force Whether to force fetching the sticker from the API even if it exists in the cache.
         * @returns A Promise that resolves to the fetched sticker.
         */
        fetch: (guildId: string, stickerId: string, force?: boolean) => Promise<import("../../structures").Sticker>;
        /**
         * Deletes a sticker from the guild.
         * @param guildId The ID of the guild.
         * @param stickerId The ID of the sticker to delete.
         * @param reason The reason for deleting the sticker.
         * @returns A Promise that resolves once the sticker is deleted.
         */
        delete: (guildId: string, stickerId: string, reason?: string) => Promise<void>;
    };
}
