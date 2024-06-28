import type { GatewayGuildAuditLogEntryCreateDispatchData, GatewayGuildBanAddDispatchData, GatewayGuildBanRemoveDispatchData, GatewayGuildCreateDispatchData, GatewayGuildDeleteDispatchData, GatewayGuildEmojisUpdateDispatchData, GatewayGuildIntegrationsUpdateDispatchData, GatewayGuildMemberAddDispatchData, GatewayGuildMemberRemoveDispatchData, GatewayGuildMemberUpdateDispatchData, GatewayGuildMembersChunkDispatchData, GatewayGuildRoleCreateDispatchData, GatewayGuildRoleDeleteDispatchData, GatewayGuildRoleUpdateDispatchData, GatewayGuildScheduledEventCreateDispatchData, GatewayGuildScheduledEventDeleteDispatchData, GatewayGuildScheduledEventUpdateDispatchData, GatewayGuildScheduledEventUserAddDispatchData, GatewayGuildScheduledEventUserRemoveDispatchData, GatewayGuildStickersUpdateDispatchData, GatewayGuildUpdateDispatchData } from 'discord-api-types/v10';
import type { UsingClient } from '../../commands';
import { type GuildMemberStructure, type GuildRoleStructure, type GuildStructure } from '../../client/transformers';
export declare const GUILD_AUDIT_LOG_ENTRY_CREATE: (_self: UsingClient, data: GatewayGuildAuditLogEntryCreateDispatchData) => {
    guildId: string;
    targetId: string | null;
    changes?: ({
        key: "$add";
        newValue?: {
            name: string;
            id: string;
        }[] | undefined;
        oldValue?: {
            name: string;
            id: string;
        }[] | undefined;
    } | {
        key: "$remove";
        newValue?: {
            name: string;
            id: string;
        }[] | undefined;
        oldValue?: {
            name: string;
            id: string;
        }[] | undefined;
    } | {
        key: "actions";
        newValue?: {
            type: import("discord-api-types/v10").AutoModerationActionType;
            metadata?: {
                channelId?: string | undefined;
                durationSeconds?: number | undefined;
                customMessage?: string | undefined;
            } | undefined;
        }[] | undefined;
        oldValue?: {
            type: import("discord-api-types/v10").AutoModerationActionType;
            metadata?: {
                channelId?: string | undefined;
                durationSeconds?: number | undefined;
                customMessage?: string | undefined;
            } | undefined;
        }[] | undefined;
    } | {
        key: "afk_channel_id";
        newValue?: string | undefined;
        oldValue?: string | undefined;
    } | {
        key: "afk_timeout";
        newValue?: number | undefined;
        oldValue?: number | undefined;
    } | {
        key: "allow";
        newValue?: string | undefined;
        oldValue?: string | undefined;
    } | {
        key: "application_id";
        newValue?: string | undefined;
        oldValue?: string | undefined;
    } | {
        key: "archived";
        newValue?: boolean | undefined;
        oldValue?: boolean | undefined;
    } | {
        key: "asset";
        newValue?: "" | undefined;
        oldValue?: "" | undefined;
    } | {
        key: "auto_archive_duration";
        newValue?: number | undefined;
        oldValue?: number | undefined;
    } | {
        key: "available";
        newValue?: boolean | undefined;
        oldValue?: boolean | undefined;
    } | {
        key: "available_tags";
        newValue?: {
            id: string;
            name: string;
            moderated: boolean;
            emojiId: string | null;
            emojiName: string | null;
        }[] | undefined;
        oldValue?: {
            id: string;
            name: string;
            moderated: boolean;
            emojiId: string | null;
            emojiName: string | null;
        }[] | undefined;
    } | {
        key: "avatar_hash";
        newValue?: string | undefined;
        oldValue?: string | undefined;
    } | {
        key: "banner_hash";
        newValue?: string | undefined;
        oldValue?: string | undefined;
    } | {
        key: "bitrate";
        newValue?: number | undefined;
        oldValue?: number | undefined;
    } | {
        key: "channel_id";
        newValue?: string | undefined;
        oldValue?: string | undefined;
    } | {
        key: "code";
        newValue?: string | undefined;
        oldValue?: string | undefined;
    } | {
        key: "color";
        newValue?: number | undefined;
        oldValue?: number | undefined;
    } | {
        key: "communication_disabled_until";
        newValue?: string | undefined;
        oldValue?: string | undefined;
    } | {
        key: "deaf";
        newValue?: boolean | undefined;
        oldValue?: boolean | undefined;
    } | {
        key: "default_auto_archive_duration";
        newValue?: number | undefined;
        oldValue?: number | undefined;
    } | {
        key: "default_message_notifications";
        newValue?: import("discord-api-types/v10").GuildDefaultMessageNotifications | undefined;
        oldValue?: import("discord-api-types/v10").GuildDefaultMessageNotifications | undefined;
    } | {
        key: "default_reaction_emoji";
        newValue?: {
            emojiId: string | null;
            emojiName: string | null;
        } | undefined;
        oldValue?: {
            emojiId: string | null;
            emojiName: string | null;
        } | undefined;
    } | {
        key: "default_thread_rate_limit_per_user";
        newValue?: number | undefined;
        oldValue?: number | undefined;
    } | {
        key: "deny";
        newValue?: string | undefined;
        oldValue?: string | undefined;
    } | {
        key: "description";
        newValue?: string | undefined;
        oldValue?: string | undefined;
    } | {
        key: "discovery_splash_hash";
        newValue?: string | undefined;
        oldValue?: string | undefined;
    } | {
        key: "enabled";
        newValue?: boolean | undefined;
        oldValue?: boolean | undefined;
    } | {
        key: "enable_emoticons";
        newValue?: boolean | undefined;
        oldValue?: boolean | undefined;
    } | {
        key: "entity_type";
        newValue?: import("discord-api-types/v10").GuildScheduledEventEntityType | undefined;
        oldValue?: import("discord-api-types/v10").GuildScheduledEventEntityType | undefined;
    } | {
        key: "event_type";
        newValue?: import("discord-api-types/v10").AutoModerationRuleEventType | undefined;
        oldValue?: import("discord-api-types/v10").AutoModerationRuleEventType | undefined;
    } | {
        key: "exempt_channels";
        newValue?: string[] | undefined;
        oldValue?: string[] | undefined;
    } | {
        key: "exempt_roles";
        newValue?: string[] | undefined;
        oldValue?: string[] | undefined;
    } | {
        key: "expire_behavior";
        newValue?: import("discord-api-types/v10").IntegrationExpireBehavior | undefined;
        oldValue?: import("discord-api-types/v10").IntegrationExpireBehavior | undefined;
    } | {
        key: "expire_grace_period";
        newValue?: number | undefined;
        oldValue?: number | undefined;
    } | {
        key: "explicit_content_filter";
        newValue?: import("discord-api-types/v10").GuildExplicitContentFilter | undefined;
        oldValue?: import("discord-api-types/v10").GuildExplicitContentFilter | undefined;
    } | {
        key: "flags";
        newValue?: number | undefined;
        oldValue?: number | undefined;
    } | {
        key: "format_type";
        newValue?: import("discord-api-types/v10").StickerFormatType | undefined;
        oldValue?: import("discord-api-types/v10").StickerFormatType | undefined;
    } | {
        key: "guild_id";
        newValue?: string | undefined;
        oldValue?: string | undefined;
    } | {
        key: "hoist";
        newValue?: boolean | undefined;
        oldValue?: boolean | undefined;
    } | {
        key: "icon_hash";
        newValue?: string | undefined;
        oldValue?: string | undefined;
    } | {
        key: "id";
        newValue?: string | undefined;
        oldValue?: string | undefined;
    } | {
        key: "image_hash";
        newValue?: string | undefined;
        oldValue?: string | undefined;
    } | {
        key: "inviter_id";
        newValue?: string | undefined;
        oldValue?: string | undefined;
    } | {
        key: "location";
        newValue?: string | undefined;
        oldValue?: string | undefined;
    } | {
        key: "locked";
        newValue?: boolean | undefined;
        oldValue?: boolean | undefined;
    } | {
        key: "max_age";
        newValue?: number | undefined;
        oldValue?: number | undefined;
    } | {
        key: "max_uses";
        newValue?: number | undefined;
        oldValue?: number | undefined;
    } | {
        key: "mentionable";
        newValue?: boolean | undefined;
        oldValue?: boolean | undefined;
    } | {
        key: "mfa_level";
        newValue?: import("discord-api-types/v10").GuildMFALevel | undefined;
        oldValue?: import("discord-api-types/v10").GuildMFALevel | undefined;
    } | {
        key: "mute";
        newValue?: boolean | undefined;
        oldValue?: boolean | undefined;
    } | {
        key: "name";
        newValue?: string | undefined;
        oldValue?: string | undefined;
    } | {
        key: "nick";
        newValue?: string | undefined;
        oldValue?: string | undefined;
    } | {
        key: "nsfw";
        newValue?: boolean | undefined;
        oldValue?: boolean | undefined;
    } | {
        key: "owner_id";
        newValue?: string | undefined;
        oldValue?: string | undefined;
    } | {
        key: "permission_overwrites";
        newValue?: {
            id: string;
            type: import("discord-api-types/v10").OverwriteType;
            allow: string;
            deny: string;
        }[] | undefined;
        oldValue?: {
            id: string;
            type: import("discord-api-types/v10").OverwriteType;
            allow: string;
            deny: string;
        }[] | undefined;
    } | {
        key: "permissions";
        newValue?: string | undefined;
        oldValue?: string | undefined;
    } | {
        key: "position";
        newValue?: number | undefined;
        oldValue?: number | undefined;
    } | {
        key: "preferred_locale";
        newValue?: string | undefined;
        oldValue?: string | undefined;
    } | {
        key: "privacy_level";
        newValue?: import("discord-api-types/v10").StageInstancePrivacyLevel | undefined;
        oldValue?: import("discord-api-types/v10").StageInstancePrivacyLevel | undefined;
    } | {
        key: "prune_delete_days";
        newValue?: number | undefined;
        oldValue?: number | undefined;
    } | {
        key: "public_updates_channel_id";
        newValue?: string | undefined;
        oldValue?: string | undefined;
    } | {
        key: "rate_limit_per_user";
        newValue?: number | undefined;
        oldValue?: number | undefined;
    } | {
        key: "region";
        newValue?: string | undefined;
        oldValue?: string | undefined;
    } | {
        key: "rules_channel_id";
        newValue?: string | undefined;
        oldValue?: string | undefined;
    } | {
        key: "splash_hash";
        newValue?: string | undefined;
        oldValue?: string | undefined;
    } | {
        key: "status";
        newValue?: import("discord-api-types/v10").GuildScheduledEventStatus | undefined;
        oldValue?: import("discord-api-types/v10").GuildScheduledEventStatus | undefined;
    } | {
        key: "system_channel_flags";
        newValue?: import("discord-api-types/v10").GuildSystemChannelFlags | undefined;
        oldValue?: import("discord-api-types/v10").GuildSystemChannelFlags | undefined;
    } | {
        key: "system_channel_id";
        newValue?: string | undefined;
        oldValue?: string | undefined;
    } | {
        key: "tags";
        newValue?: string | undefined;
        oldValue?: string | undefined;
    } | {
        key: "temporary";
        newValue?: boolean | undefined;
        oldValue?: boolean | undefined;
    } | {
        key: "topic";
        newValue?: string | undefined;
        oldValue?: string | undefined;
    } | {
        key: "trigger_metadata";
        newValue?: {
            keywordFilter?: string[] | undefined;
            presets?: import("discord-api-types/v10").AutoModerationRuleKeywordPresetType[] | undefined;
            allowList?: string[] | undefined;
            regexPatterns?: string[] | undefined;
            mentionTotalLimit?: number | undefined;
            mentionRaidProtectionEnabled?: boolean | undefined;
        } | undefined;
        oldValue?: {
            keywordFilter?: string[] | undefined;
            presets?: import("discord-api-types/v10").AutoModerationRuleKeywordPresetType[] | undefined;
            allowList?: string[] | undefined;
            regexPatterns?: string[] | undefined;
            mentionTotalLimit?: number | undefined;
            mentionRaidProtectionEnabled?: boolean | undefined;
        } | undefined;
    } | {
        key: "trigger_type";
        newValue?: import("discord-api-types/v10").AutoModerationRuleTriggerType | undefined;
        oldValue?: import("discord-api-types/v10").AutoModerationRuleTriggerType | undefined;
    } | {
        key: "type";
        newValue?: string | number | undefined;
        oldValue?: string | number | undefined;
    } | {
        key: "user_limit";
        newValue?: number | undefined;
        oldValue?: number | undefined;
    } | {
        key: "uses";
        newValue?: number | undefined;
        oldValue?: number | undefined;
    } | {
        key: "vanity_url_code";
        newValue?: string | undefined;
        oldValue?: string | undefined;
    } | {
        key: "verification_level";
        newValue?: import("discord-api-types/v10").GuildVerificationLevel | undefined;
        oldValue?: import("discord-api-types/v10").GuildVerificationLevel | undefined;
    } | {
        key: "widget_channel_id";
        newValue?: string | undefined;
        oldValue?: string | undefined;
    } | {
        key: "widget_enabled";
        newValue?: boolean | undefined;
        oldValue?: boolean | undefined;
    })[] | undefined;
    userId: string | null;
    id: string;
    actionType: import("discord-api-types/v10").AuditLogEvent;
    options?: {
        autoModerationRuleName?: string | undefined;
        autoModerationRuleTriggerType?: "1" | "3" | "4" | "5" | "6" | undefined;
        deleteMemberDays?: string | undefined;
        membersRemoved?: string | undefined;
        channelId?: string | undefined;
        messageId?: string | undefined;
        count?: string | undefined;
        id?: string | undefined;
        type?: import("discord-api-types/v10").AuditLogOptionsType | undefined;
        roleName?: string | undefined;
        integrationType?: import("discord-api-types/v10").APIGuildIntegrationType | undefined;
    } | undefined;
    reason?: string | undefined;
};
export declare const GUILD_BAN_ADD: (self: UsingClient, data: GatewayGuildBanAddDispatchData) => {
    user: import("../..").User;
    guildId: string;
};
export declare const GUILD_BAN_REMOVE: (self: UsingClient, data: GatewayGuildBanRemoveDispatchData) => {
    user: import("../..").User;
    guildId: string;
};
export declare const GUILD_CREATE: (self: UsingClient, data: GatewayGuildCreateDispatchData) => import("../..").Guild<"create">;
export declare const GUILD_DELETE: (self: UsingClient, data: GatewayGuildDeleteDispatchData) => Promise<import("discord-api-types/v10").APIUnavailableGuild | import("../..").Guild<"cached">>;
export declare const GUILD_EMOJIS_UPDATE: (self: UsingClient, data: GatewayGuildEmojisUpdateDispatchData) => {
    emojis: import("../..").GuildEmoji[];
    guildId: string;
};
export declare const GUILD_INTEGRATIONS_UPDATE: (_self: UsingClient, data: GatewayGuildIntegrationsUpdateDispatchData) => {
    guildId: string;
};
export declare const GUILD_MEMBER_ADD: (self: UsingClient, data: GatewayGuildMemberAddDispatchData) => import("../..").GuildMember;
export declare const GUILD_MEMBER_REMOVE: (self: UsingClient, data: GatewayGuildMemberRemoveDispatchData) => {
    user: import("../..").User;
    guildId: string;
};
export declare const GUILD_MEMBERS_CHUNK: (self: UsingClient, data: GatewayGuildMembersChunkDispatchData) => {
    members: import("../..").GuildMember[];
    guildId: string;
    chunkIndex: number;
    chunkCount: number;
    notFound?: {}[] | undefined;
    presences?: {
        user: {
            id: string;
            username?: string | undefined;
            discriminator?: string | undefined;
            globalName?: string | null | undefined;
            avatar?: string | null | undefined;
            bot?: boolean | undefined;
            system?: boolean | undefined;
            mfaEnabled?: boolean | undefined;
            banner?: string | null | undefined;
            accentColor?: number | null | undefined;
            locale?: string | undefined;
            verified?: boolean | undefined;
            email?: string | null | undefined;
            flags?: import("discord-api-types/v10").UserFlags | undefined;
            premiumType?: import("discord-api-types/v10").UserPremiumType | undefined;
            publicFlags?: import("discord-api-types/v10").UserFlags | undefined;
            avatarDecoration?: string | null | undefined;
            avatarDecorationData?: {
                asset: string;
                skuId: string;
            } | null | undefined;
        };
        status?: import("discord-api-types/v10").PresenceUpdateReceiveStatus | undefined;
        activities?: {
            id: string;
            name: string;
            type: import("discord-api-types/v10").ActivityType;
            url?: string | null | undefined;
            createdAt: number;
            timestamps?: {
                start?: number | undefined;
                end?: number | undefined;
            } | undefined;
            syncId?: string | undefined;
            platform?: string | undefined;
            applicationId?: string | undefined;
            details?: string | null | undefined;
            state?: string | null | undefined;
            emoji?: {
                id?: string | null | undefined;
                animated?: boolean | undefined;
                name: string | null;
            } | undefined;
            sessionId?: string | undefined;
            party?: {
                id?: string | undefined;
                size?: [current_size: number, max_size: number] | undefined;
            } | undefined;
            assets?: {
                largeImage?: string | undefined;
                largeText?: string | undefined;
                smallImage?: string | undefined;
                smallText?: string | undefined;
            } | undefined;
            secrets?: {
                match?: string | undefined;
                join?: string | undefined;
                spectate?: string | undefined;
            } | undefined;
            instance?: boolean | undefined;
            flags?: import("discord-api-types/v10").ActivityFlags | undefined;
            buttons?: string[] | {
                label: string;
                url: string;
            }[] | undefined;
        }[] | undefined;
        clientStatus?: {
            desktop?: import("discord-api-types/v10").PresenceUpdateReceiveStatus | undefined;
            mobile?: import("discord-api-types/v10").PresenceUpdateReceiveStatus | undefined;
            web?: import("discord-api-types/v10").PresenceUpdateReceiveStatus | undefined;
        } | undefined;
    }[] | undefined;
    nonce?: string | undefined;
};
export declare const GUILD_MEMBER_UPDATE: (self: UsingClient, data: GatewayGuildMemberUpdateDispatchData) => Promise<[member: GuildMemberStructure, old?: GuildMemberStructure]>;
export declare const GUILD_SCHEDULED_EVENT_CREATE: (_self: UsingClient, data: GatewayGuildScheduledEventCreateDispatchData) => {
    channelId: string;
    entityMetadata: undefined;
    id: string;
    guildId: string;
    creatorId?: string | null | undefined;
    name: string;
    description?: string | null | undefined;
    scheduledStartTime: string;
    scheduledEndTime: string | null;
    privacyLevel: import("discord-api-types/v10").GuildScheduledEventPrivacyLevel;
    status: import("discord-api-types/v10").GuildScheduledEventStatus;
    entityType: import("discord-api-types/v10").GuildScheduledEventEntityType.StageInstance;
    entityId: string | null;
    creator?: {
        id: string;
        username: string;
        discriminator: string;
        globalName: string | null;
        avatar: string | null;
        bot?: boolean | undefined;
        system?: boolean | undefined;
        mfaEnabled?: boolean | undefined;
        banner?: string | null | undefined;
        accentColor?: number | null | undefined;
        locale?: string | undefined;
        verified?: boolean | undefined;
        email?: string | null | undefined;
        flags?: import("discord-api-types/v10").UserFlags | undefined;
        premiumType?: import("discord-api-types/v10").UserPremiumType | undefined;
        publicFlags?: import("discord-api-types/v10").UserFlags | undefined;
        avatarDecoration?: string | null | undefined;
        avatarDecorationData?: import("discord-api-types/v10").APIAvatarDecorationData | null | undefined;
    } | undefined;
    userCount?: number | undefined;
    image?: string | null | undefined;
} | {
    channelId: string;
    entityMetadata: undefined;
    id: string;
    guildId: string;
    creatorId?: string | null | undefined;
    name: string;
    description?: string | null | undefined;
    scheduledStartTime: string;
    scheduledEndTime: string | null;
    privacyLevel: import("discord-api-types/v10").GuildScheduledEventPrivacyLevel;
    status: import("discord-api-types/v10").GuildScheduledEventStatus;
    entityType: import("discord-api-types/v10").GuildScheduledEventEntityType.Voice;
    entityId: string | null;
    creator?: {
        id: string;
        username: string;
        discriminator: string;
        globalName: string | null;
        avatar: string | null;
        bot?: boolean | undefined;
        system?: boolean | undefined;
        mfaEnabled?: boolean | undefined;
        banner?: string | null | undefined;
        accentColor?: number | null | undefined;
        locale?: string | undefined;
        verified?: boolean | undefined;
        email?: string | null | undefined;
        flags?: import("discord-api-types/v10").UserFlags | undefined;
        premiumType?: import("discord-api-types/v10").UserPremiumType | undefined;
        publicFlags?: import("discord-api-types/v10").UserFlags | undefined;
        avatarDecoration?: string | null | undefined;
        avatarDecorationData?: import("discord-api-types/v10").APIAvatarDecorationData | null | undefined;
    } | undefined;
    userCount?: number | undefined;
    image?: string | null | undefined;
} | {
    channelId: undefined;
    entityMetadata: {
        location: string;
    };
    id: string;
    guildId: string;
    creatorId?: string | null | undefined;
    name: string;
    description?: string | null | undefined;
    scheduledStartTime: string;
    scheduledEndTime: string | null;
    privacyLevel: import("discord-api-types/v10").GuildScheduledEventPrivacyLevel;
    status: import("discord-api-types/v10").GuildScheduledEventStatus;
    entityType: import("discord-api-types/v10").GuildScheduledEventEntityType.External;
    entityId: string | null;
    creator?: {
        id: string;
        username: string;
        discriminator: string;
        globalName: string | null;
        avatar: string | null;
        bot?: boolean | undefined;
        system?: boolean | undefined;
        mfaEnabled?: boolean | undefined;
        banner?: string | null | undefined;
        accentColor?: number | null | undefined;
        locale?: string | undefined;
        verified?: boolean | undefined;
        email?: string | null | undefined;
        flags?: import("discord-api-types/v10").UserFlags | undefined;
        premiumType?: import("discord-api-types/v10").UserPremiumType | undefined;
        publicFlags?: import("discord-api-types/v10").UserFlags | undefined;
        avatarDecoration?: string | null | undefined;
        avatarDecorationData?: import("discord-api-types/v10").APIAvatarDecorationData | null | undefined;
    } | undefined;
    userCount?: number | undefined;
    image?: string | null | undefined;
};
export declare const GUILD_SCHEDULED_EVENT_UPDATE: (_self: UsingClient, data: GatewayGuildScheduledEventUpdateDispatchData) => {
    channelId: string;
    entityMetadata: undefined;
    id: string;
    guildId: string;
    creatorId?: string | null | undefined;
    name: string;
    description?: string | null | undefined;
    scheduledStartTime: string;
    scheduledEndTime: string | null;
    privacyLevel: import("discord-api-types/v10").GuildScheduledEventPrivacyLevel;
    status: import("discord-api-types/v10").GuildScheduledEventStatus;
    entityType: import("discord-api-types/v10").GuildScheduledEventEntityType.StageInstance;
    entityId: string | null;
    creator?: {
        id: string;
        username: string;
        discriminator: string;
        globalName: string | null;
        avatar: string | null;
        bot?: boolean | undefined;
        system?: boolean | undefined;
        mfaEnabled?: boolean | undefined;
        banner?: string | null | undefined;
        accentColor?: number | null | undefined;
        locale?: string | undefined;
        verified?: boolean | undefined;
        email?: string | null | undefined;
        flags?: import("discord-api-types/v10").UserFlags | undefined;
        premiumType?: import("discord-api-types/v10").UserPremiumType | undefined;
        publicFlags?: import("discord-api-types/v10").UserFlags | undefined;
        avatarDecoration?: string | null | undefined;
        avatarDecorationData?: import("discord-api-types/v10").APIAvatarDecorationData | null | undefined;
    } | undefined;
    userCount?: number | undefined;
    image?: string | null | undefined;
} | {
    channelId: string;
    entityMetadata: undefined;
    id: string;
    guildId: string;
    creatorId?: string | null | undefined;
    name: string;
    description?: string | null | undefined;
    scheduledStartTime: string;
    scheduledEndTime: string | null;
    privacyLevel: import("discord-api-types/v10").GuildScheduledEventPrivacyLevel;
    status: import("discord-api-types/v10").GuildScheduledEventStatus;
    entityType: import("discord-api-types/v10").GuildScheduledEventEntityType.Voice;
    entityId: string | null;
    creator?: {
        id: string;
        username: string;
        discriminator: string;
        globalName: string | null;
        avatar: string | null;
        bot?: boolean | undefined;
        system?: boolean | undefined;
        mfaEnabled?: boolean | undefined;
        banner?: string | null | undefined;
        accentColor?: number | null | undefined;
        locale?: string | undefined;
        verified?: boolean | undefined;
        email?: string | null | undefined;
        flags?: import("discord-api-types/v10").UserFlags | undefined;
        premiumType?: import("discord-api-types/v10").UserPremiumType | undefined;
        publicFlags?: import("discord-api-types/v10").UserFlags | undefined;
        avatarDecoration?: string | null | undefined;
        avatarDecorationData?: import("discord-api-types/v10").APIAvatarDecorationData | null | undefined;
    } | undefined;
    userCount?: number | undefined;
    image?: string | null | undefined;
} | {
    channelId: undefined;
    entityMetadata: {
        location: string;
    };
    id: string;
    guildId: string;
    creatorId?: string | null | undefined;
    name: string;
    description?: string | null | undefined;
    scheduledStartTime: string;
    scheduledEndTime: string | null;
    privacyLevel: import("discord-api-types/v10").GuildScheduledEventPrivacyLevel;
    status: import("discord-api-types/v10").GuildScheduledEventStatus;
    entityType: import("discord-api-types/v10").GuildScheduledEventEntityType.External;
    entityId: string | null;
    creator?: {
        id: string;
        username: string;
        discriminator: string;
        globalName: string | null;
        avatar: string | null;
        bot?: boolean | undefined;
        system?: boolean | undefined;
        mfaEnabled?: boolean | undefined;
        banner?: string | null | undefined;
        accentColor?: number | null | undefined;
        locale?: string | undefined;
        verified?: boolean | undefined;
        email?: string | null | undefined;
        flags?: import("discord-api-types/v10").UserFlags | undefined;
        premiumType?: import("discord-api-types/v10").UserPremiumType | undefined;
        publicFlags?: import("discord-api-types/v10").UserFlags | undefined;
        avatarDecoration?: string | null | undefined;
        avatarDecorationData?: import("discord-api-types/v10").APIAvatarDecorationData | null | undefined;
    } | undefined;
    userCount?: number | undefined;
    image?: string | null | undefined;
};
export declare const GUILD_SCHEDULED_EVENT_DELETE: (_self: UsingClient, data: GatewayGuildScheduledEventDeleteDispatchData) => {
    channelId: string;
    entityMetadata: undefined;
    id: string;
    guildId: string;
    creatorId?: string | null | undefined;
    name: string;
    description?: string | null | undefined;
    scheduledStartTime: string;
    scheduledEndTime: string | null;
    privacyLevel: import("discord-api-types/v10").GuildScheduledEventPrivacyLevel;
    status: import("discord-api-types/v10").GuildScheduledEventStatus;
    entityType: import("discord-api-types/v10").GuildScheduledEventEntityType.StageInstance;
    entityId: string | null;
    creator?: {
        id: string;
        username: string;
        discriminator: string;
        globalName: string | null;
        avatar: string | null;
        bot?: boolean | undefined;
        system?: boolean | undefined;
        mfaEnabled?: boolean | undefined;
        banner?: string | null | undefined;
        accentColor?: number | null | undefined;
        locale?: string | undefined;
        verified?: boolean | undefined;
        email?: string | null | undefined;
        flags?: import("discord-api-types/v10").UserFlags | undefined;
        premiumType?: import("discord-api-types/v10").UserPremiumType | undefined;
        publicFlags?: import("discord-api-types/v10").UserFlags | undefined;
        avatarDecoration?: string | null | undefined;
        avatarDecorationData?: import("discord-api-types/v10").APIAvatarDecorationData | null | undefined;
    } | undefined;
    userCount?: number | undefined;
    image?: string | null | undefined;
} | {
    channelId: string;
    entityMetadata: undefined;
    id: string;
    guildId: string;
    creatorId?: string | null | undefined;
    name: string;
    description?: string | null | undefined;
    scheduledStartTime: string;
    scheduledEndTime: string | null;
    privacyLevel: import("discord-api-types/v10").GuildScheduledEventPrivacyLevel;
    status: import("discord-api-types/v10").GuildScheduledEventStatus;
    entityType: import("discord-api-types/v10").GuildScheduledEventEntityType.Voice;
    entityId: string | null;
    creator?: {
        id: string;
        username: string;
        discriminator: string;
        globalName: string | null;
        avatar: string | null;
        bot?: boolean | undefined;
        system?: boolean | undefined;
        mfaEnabled?: boolean | undefined;
        banner?: string | null | undefined;
        accentColor?: number | null | undefined;
        locale?: string | undefined;
        verified?: boolean | undefined;
        email?: string | null | undefined;
        flags?: import("discord-api-types/v10").UserFlags | undefined;
        premiumType?: import("discord-api-types/v10").UserPremiumType | undefined;
        publicFlags?: import("discord-api-types/v10").UserFlags | undefined;
        avatarDecoration?: string | null | undefined;
        avatarDecorationData?: import("discord-api-types/v10").APIAvatarDecorationData | null | undefined;
    } | undefined;
    userCount?: number | undefined;
    image?: string | null | undefined;
} | {
    channelId: undefined;
    entityMetadata: {
        location: string;
    };
    id: string;
    guildId: string;
    creatorId?: string | null | undefined;
    name: string;
    description?: string | null | undefined;
    scheduledStartTime: string;
    scheduledEndTime: string | null;
    privacyLevel: import("discord-api-types/v10").GuildScheduledEventPrivacyLevel;
    status: import("discord-api-types/v10").GuildScheduledEventStatus;
    entityType: import("discord-api-types/v10").GuildScheduledEventEntityType.External;
    entityId: string | null;
    creator?: {
        id: string;
        username: string;
        discriminator: string;
        globalName: string | null;
        avatar: string | null;
        bot?: boolean | undefined;
        system?: boolean | undefined;
        mfaEnabled?: boolean | undefined;
        banner?: string | null | undefined;
        accentColor?: number | null | undefined;
        locale?: string | undefined;
        verified?: boolean | undefined;
        email?: string | null | undefined;
        flags?: import("discord-api-types/v10").UserFlags | undefined;
        premiumType?: import("discord-api-types/v10").UserPremiumType | undefined;
        publicFlags?: import("discord-api-types/v10").UserFlags | undefined;
        avatarDecoration?: string | null | undefined;
        avatarDecorationData?: import("discord-api-types/v10").APIAvatarDecorationData | null | undefined;
    } | undefined;
    userCount?: number | undefined;
    image?: string | null | undefined;
};
export declare const GUILD_SCHEDULED_EVENT_USER_ADD: (_self: UsingClient, data: GatewayGuildScheduledEventUserAddDispatchData) => {
    guildScheduledEventId: string;
    userId: string;
    guildId: string;
};
export declare const GUILD_SCHEDULED_EVENT_USER_REMOVE: (_self: UsingClient, data: GatewayGuildScheduledEventUserRemoveDispatchData) => {
    guildScheduledEventId: string;
    userId: string;
    guildId: string;
};
export declare const GUILD_ROLE_CREATE: (self: UsingClient, data: GatewayGuildRoleCreateDispatchData) => import("../..").GuildRole;
export declare const GUILD_ROLE_DELETE: (self: UsingClient, data: GatewayGuildRoleDeleteDispatchData) => Promise<import("../..").GuildRole | {
    guildId: string;
    roleId: string;
}>;
export declare const GUILD_ROLE_UPDATE: (self: UsingClient, data: GatewayGuildRoleUpdateDispatchData) => Promise<[role: GuildRoleStructure, old?: GuildRoleStructure]>;
export declare const GUILD_STICKERS_UPDATE: (self: UsingClient, data: GatewayGuildStickersUpdateDispatchData) => {
    stickers: import("../..").Sticker[];
    guildId: string;
};
export declare const GUILD_UPDATE: (self: UsingClient, data: GatewayGuildUpdateDispatchData) => Promise<[guild: GuildStructure, old?: GuildStructure<"cached">]>;
