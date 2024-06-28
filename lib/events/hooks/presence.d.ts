import type { GatewayPresenceUpdateDispatchData } from 'discord-api-types/v10';
import type { UsingClient } from '../../commands';
export declare const PRESENCE_UPDATE: (self: UsingClient, data: GatewayPresenceUpdateDispatchData) => Promise<readonly [{
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
    guildId: string;
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
}, import("../..").ReturnCache<(Omit<import("discord-api-types/v10").GatewayPresenceUpdate, "user"> & {
    id: string;
    user_id: string;
} & {
    guild_id: string;
}) | undefined>]>;
