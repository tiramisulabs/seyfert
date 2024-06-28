import type { GatewayInviteCreateDispatchData, GatewayInviteDeleteDispatchData } from 'discord-api-types/v10';
import type { UsingClient } from '../../commands';
export declare const INVITE_CREATE: (_self: UsingClient, data: GatewayInviteCreateDispatchData) => {
    channelId: string;
    code: string;
    createdAt: number;
    guildId?: string | undefined;
    inviter?: {
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
    maxAge: number;
    maxUses: number;
    targetType?: import("discord-api-types/v10").InviteTargetType | undefined;
    targetUser?: {
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
    targetApplication?: {
        id?: string | undefined;
        name?: string | undefined;
        icon?: string | null | undefined;
        description?: string | undefined;
        rpcOrigins?: string[] | undefined;
        botPublic?: boolean | undefined;
        botRequireCodeGrant?: boolean | undefined;
        bot?: import("discord-api-types/v10").APIUser | undefined;
        termsOfServiceUrl?: string | undefined;
        privacyPolicyUrl?: string | undefined;
        owner?: import("discord-api-types/v10").APIUser | undefined;
        summary?: "" | undefined;
        verifyKey?: string | undefined;
        team?: import("discord-api-types/v10").APITeam | null | undefined;
        guildId?: string | undefined;
        guild?: import("discord-api-types/v10").APIPartialGuild | undefined;
        primarySkuId?: string | undefined;
        slug?: string | undefined;
        coverImage?: string | undefined;
        flags?: import("discord-api-types/v10").ApplicationFlags | undefined;
        approximateGuildCount?: number | undefined;
        redirectUris?: string[] | undefined;
        interactionsEndpointUrl?: string | undefined;
        roleConnectionsVerificationUrl?: string | undefined;
        tags?: [string, (string | undefined)?, (string | undefined)?, (string | undefined)?, (string | undefined)?] | undefined;
        installParams?: import("discord-api-types/v10").APIApplicationInstallParams | undefined;
        integrationTypesConfig?: import("discord-api-types/v10").APIApplicationIntegrationTypesConfigMap | undefined;
        customInstallUrl?: string | undefined;
    } | undefined;
    temporary: boolean;
    uses: 0;
};
export declare const INVITE_DELETE: (_self: UsingClient, data: GatewayInviteDeleteDispatchData) => {
    channelId: string;
    guildId?: string | undefined;
    code: string;
};
