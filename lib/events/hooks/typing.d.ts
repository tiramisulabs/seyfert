import type { GatewayTypingStartDispatchData } from 'discord-api-types/v10';
import type { UsingClient } from '../../commands';
export declare const TYPING_START: (self: UsingClient, data: GatewayTypingStartDispatchData) => {
    channelId: string;
    guildId?: string | undefined;
    userId: string;
    timestamp: number;
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
} | {
    member: import("../..").GuildMember;
    channelId: string;
    guildId?: string | undefined;
    userId: string;
    timestamp: number;
};
