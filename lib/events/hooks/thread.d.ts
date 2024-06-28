import type { GatewayThreadCreateDispatchData, GatewayThreadDeleteDispatchData, GatewayThreadListSyncDispatchData, GatewayThreadMemberUpdateDispatchData, GatewayThreadMembersUpdateDispatchData, GatewayThreadUpdateDispatchData } from 'discord-api-types/v10';
import type { UsingClient } from '../../commands';
import { type ThreadChannelStructure } from '../../client/transformers';
export declare const THREAD_CREATE: (self: UsingClient, data: GatewayThreadCreateDispatchData) => import("../..").ThreadChannel;
export declare const THREAD_DELETE: (self: UsingClient, data: GatewayThreadDeleteDispatchData) => import("../..").ThreadChannel;
export declare const THREAD_LIST_SYNC: (_self: UsingClient, data: GatewayThreadListSyncDispatchData) => {
    guildId: string;
    channelIds?: string[] | undefined;
    threads: ({
        name: undefined;
        type: import("discord-api-types/v10").ChannelType.DM;
        id: string;
        flags?: import("discord-api-types/v10").ChannelFlags | undefined;
        lastMessageId?: string | null | undefined;
        lastPinTimestamp?: string | null | undefined;
        recipients?: {
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
            avatarDecorationData?: {
                asset: string;
                skuId: string;
            } | null | undefined;
        }[] | undefined;
    } | {
        defaultForumLayout: import("discord-api-types/v10").ForumLayoutType;
        topic?: string | null | undefined;
        lastMessageId?: string | null | undefined;
        rateLimitPerUser?: number | undefined;
        lastPinTimestamp?: string | null | undefined;
        defaultAutoArchiveDuration?: import("discord-api-types/v10").ThreadAutoArchiveDuration | undefined;
        availableTags: {
            id: string;
            name: string;
            moderated: boolean;
            emojiId: string | null;
            emojiName: string | null;
        }[];
        defaultThreadRateLimitPerUser?: number | undefined;
        defaultReactionEmoji: {
            emojiId: string | null;
            emojiName: string | null;
        } | null;
        defaultSortOrder: import("discord-api-types/v10").SortOrderType | null;
        name: string;
        guildId?: string | undefined;
        permissionOverwrites?: {
            id: string;
            type: import("discord-api-types/v10").OverwriteType;
            allow: string;
            deny: string;
        }[] | undefined;
        position: number;
        parentId?: string | null | undefined;
        nsfw?: boolean | undefined;
        type: import("discord-api-types/v10").ChannelType.GuildForum;
        id: string;
        flags?: import("discord-api-types/v10").ChannelFlags | undefined;
    } | {
        defaultAutoArchiveDuration?: import("discord-api-types/v10").ThreadAutoArchiveDuration | undefined;
        defaultThreadRateLimitPerUser?: number | undefined;
        topic?: string | null | undefined;
        type: import("discord-api-types/v10").ChannelType.GuildAnnouncement;
        id: string;
        flags?: import("discord-api-types/v10").ChannelFlags | undefined;
        rateLimitPerUser?: number | undefined;
        lastMessageId?: string | null | undefined;
        lastPinTimestamp?: string | null | undefined;
        name: string;
        guildId?: string | undefined;
        permissionOverwrites?: {
            id: string;
            type: import("discord-api-types/v10").OverwriteType;
            allow: string;
            deny: string;
        }[] | undefined;
        position: number;
        parentId?: string | null | undefined;
        nsfw?: boolean | undefined;
    } | {
        name: string | null;
        applicationId?: string | undefined;
        icon?: string | null | undefined;
        ownerId?: string | undefined;
        lastMessageId?: string | null | undefined;
        managed?: boolean | undefined;
        type: import("discord-api-types/v10").ChannelType.GroupDM;
        id: string;
        flags?: import("discord-api-types/v10").ChannelFlags | undefined;
        lastPinTimestamp?: string | null | undefined;
        recipients?: {
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
            avatarDecorationData?: {
                asset: string;
                skuId: string;
            } | null | undefined;
        }[] | undefined;
    } | {
        name: string;
        guildId?: string | undefined;
        permissionOverwrites?: {
            id: string;
            type: import("discord-api-types/v10").OverwriteType;
            allow: string;
            deny: string;
        }[] | undefined;
        position: number;
        parentId?: string | null | undefined;
        nsfw?: boolean | undefined;
        type: import("discord-api-types/v10").ChannelType.GuildCategory;
        id: string;
        flags?: import("discord-api-types/v10").ChannelFlags | undefined;
    } | {
        topic?: string | null | undefined;
        lastMessageId?: string | null | undefined;
        rateLimitPerUser?: number | undefined;
        lastPinTimestamp?: string | null | undefined;
        defaultAutoArchiveDuration?: import("discord-api-types/v10").ThreadAutoArchiveDuration | undefined;
        availableTags: {
            id: string;
            name: string;
            moderated: boolean;
            emojiId: string | null;
            emojiName: string | null;
        }[];
        defaultThreadRateLimitPerUser?: number | undefined;
        defaultReactionEmoji: {
            emojiId: string | null;
            emojiName: string | null;
        } | null;
        defaultSortOrder: import("discord-api-types/v10").SortOrderType | null;
        name: string;
        guildId?: string | undefined;
        permissionOverwrites?: {
            id: string;
            type: import("discord-api-types/v10").OverwriteType;
            allow: string;
            deny: string;
        }[] | undefined;
        position: number;
        parentId?: string | null | undefined;
        nsfw?: boolean | undefined;
        type: import("discord-api-types/v10").ChannelType.GuildMedia;
        id: string;
        flags?: import("discord-api-types/v10").ChannelFlags | undefined;
    } | {
        bitrate?: number | undefined;
        userLimit?: number | undefined;
        rtcRegion?: string | null | undefined;
        videoQualityMode?: import("discord-api-types/v10").VideoQualityMode | undefined;
        name: string;
        guildId?: string | undefined;
        permissionOverwrites?: {
            id: string;
            type: import("discord-api-types/v10").OverwriteType;
            allow: string;
            deny: string;
        }[] | undefined;
        position: number;
        parentId?: string | null | undefined;
        nsfw?: boolean | undefined;
        type: import("discord-api-types/v10").ChannelType.GuildStageVoice;
        id: string;
        flags?: import("discord-api-types/v10").ChannelFlags | undefined;
        rateLimitPerUser?: number | undefined;
        lastMessageId?: string | null | undefined;
    } | {
        bitrate?: number | undefined;
        userLimit?: number | undefined;
        rtcRegion?: string | null | undefined;
        videoQualityMode?: import("discord-api-types/v10").VideoQualityMode | undefined;
        name: string;
        guildId?: string | undefined;
        permissionOverwrites?: {
            id: string;
            type: import("discord-api-types/v10").OverwriteType;
            allow: string;
            deny: string;
        }[] | undefined;
        position: number;
        parentId?: string | null | undefined;
        nsfw?: boolean | undefined;
        type: import("discord-api-types/v10").ChannelType.GuildVoice;
        id: string;
        flags?: import("discord-api-types/v10").ChannelFlags | undefined;
        rateLimitPerUser?: number | undefined;
        lastMessageId?: string | null | undefined;
    } | {
        defaultAutoArchiveDuration?: import("discord-api-types/v10").ThreadAutoArchiveDuration | undefined;
        defaultThreadRateLimitPerUser?: number | undefined;
        topic?: string | null | undefined;
        type: import("discord-api-types/v10").ChannelType.GuildText;
        id: string;
        flags?: import("discord-api-types/v10").ChannelFlags | undefined;
        rateLimitPerUser?: number | undefined;
        lastMessageId?: string | null | undefined;
        lastPinTimestamp?: string | null | undefined;
        name: string;
        guildId?: string | undefined;
        permissionOverwrites?: {
            id: string;
            type: import("discord-api-types/v10").OverwriteType;
            allow: string;
            deny: string;
        }[] | undefined;
        position: number;
        parentId?: string | null | undefined;
        nsfw?: boolean | undefined;
    } | {
        member?: {
            id?: string | undefined;
            userId?: string | undefined;
            joinTimestamp: string;
            flags: import("discord-api-types/v10").ThreadMemberFlags;
            member?: import("discord-api-types/v10").APIGuildMember | undefined;
        } | undefined;
        threadMetadata?: {
            archived: boolean;
            autoArchiveDuration: import("discord-api-types/v10").ThreadAutoArchiveDuration;
            archiveTimestamp: string;
            locked?: boolean | undefined;
            invitable?: boolean | undefined;
            createTimestamp?: string | undefined;
        } | undefined;
        messageCount?: number | undefined;
        memberCount?: number | undefined;
        ownerId?: string | undefined;
        totalMessageSent?: number | undefined;
        appliedTags: string[];
        type: import("discord-api-types/v10").ThreadChannelType;
        id: string;
        flags?: import("discord-api-types/v10").ChannelFlags | undefined;
        rateLimitPerUser?: number | undefined;
        lastMessageId?: string | null | undefined;
        lastPinTimestamp?: string | null | undefined;
        name: string;
        guildId?: string | undefined;
        permissionOverwrites?: {
            id: string;
            type: import("discord-api-types/v10").OverwriteType;
            allow: string;
            deny: string;
        }[] | undefined;
        position: number;
        parentId?: string | null | undefined;
        nsfw?: boolean | undefined;
    })[];
    members: {
        id?: string | undefined;
        userId?: string | undefined;
        joinTimestamp: string;
        flags: import("discord-api-types/v10").ThreadMemberFlags;
        member?: {
            user: {
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
                avatarDecorationData?: {
                    asset: string;
                    skuId: string;
                } | null | undefined;
            };
            nick?: string | null | undefined;
            avatar?: string | null | undefined;
            roles: string[];
            joinedAt: string;
            premiumSince?: string | null | undefined;
            deaf: boolean;
            mute: boolean;
            flags: import("discord-api-types/v10").GuildMemberFlags;
            pending?: boolean | undefined;
            communicationDisabledUntil?: string | null | undefined;
            avatarDecorationData?: import("discord-api-types/v10").APIAvatarDecorationData | null | undefined;
        } | undefined;
    }[];
};
export declare const THREAD_MEMBER_UPDATE: (_self: UsingClient, data: GatewayThreadMemberUpdateDispatchData) => {
    id?: string | undefined;
    userId?: string | undefined;
    joinTimestamp: string;
    flags: import("discord-api-types/v10").ThreadMemberFlags;
    member?: {
        user: {
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
            avatarDecorationData?: {
                asset: string;
                skuId: string;
            } | null | undefined;
        };
        nick?: string | null | undefined;
        avatar?: string | null | undefined;
        roles: string[];
        joinedAt: string;
        premiumSince?: string | null | undefined;
        deaf: boolean;
        mute: boolean;
        flags: import("discord-api-types/v10").GuildMemberFlags;
        pending?: boolean | undefined;
        communicationDisabledUntil?: string | null | undefined;
        avatarDecorationData?: import("discord-api-types/v10").APIAvatarDecorationData | null | undefined;
    } | undefined;
    guildId: string;
};
export declare const THREAD_MEMBERS_UPDATE: (_self: UsingClient, data: GatewayThreadMembersUpdateDispatchData) => {
    id: string;
    guildId: string;
    memberCount: number;
    addedMembers?: {
        id?: string | undefined;
        userId?: string | undefined;
        joinTimestamp: string;
        flags: import("discord-api-types/v10").ThreadMemberFlags;
        member?: {
            user: {
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
                avatarDecorationData?: {
                    asset: string;
                    skuId: string;
                } | null | undefined;
            };
            nick?: string | null | undefined;
            avatar?: string | null | undefined;
            roles: string[];
            joinedAt: string;
            premiumSince?: string | null | undefined;
            deaf: boolean;
            mute: boolean;
            flags: import("discord-api-types/v10").GuildMemberFlags;
            pending?: boolean | undefined;
            communicationDisabledUntil?: string | null | undefined;
            avatarDecorationData?: import("discord-api-types/v10").APIAvatarDecorationData | null | undefined;
        } | undefined;
    }[] | undefined;
    removedMemberIds?: string[] | undefined;
};
export declare const THREAD_UPDATE: (self: UsingClient, data: GatewayThreadUpdateDispatchData) => Promise<[thread: ThreadChannelStructure, old?: ThreadChannelStructure]>;
