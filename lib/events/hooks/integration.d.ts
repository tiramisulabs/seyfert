import type { GatewayIntegrationCreateDispatchData, GatewayIntegrationDeleteDispatchData, GatewayIntegrationUpdateDispatchData } from 'discord-api-types/v10';
import type { UsingClient } from '../../commands';
export declare const INTEGRATION_CREATE: (self: UsingClient, data: GatewayIntegrationCreateDispatchData) => {
    id: string;
    name: string;
    type: import("discord-api-types/v10").APIGuildIntegrationType;
    enabled: boolean;
    syncing?: boolean | undefined;
    roleId?: string | undefined;
    enableEmoticons?: boolean | undefined;
    expireBehavior?: import("discord-api-types/v10").IntegrationExpireBehavior | undefined;
    expireGracePeriod?: number | undefined;
    user?: {
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
    account: {
        id: string;
        name: string;
    };
    syncedAt?: string | undefined;
    subscriberCount?: number | undefined;
    revoked?: boolean | undefined;
    application?: {
        id: string;
        name: string;
        icon: string | null;
        description: string;
        bot?: import("discord-api-types/v10").APIUser | undefined;
    } | undefined;
    scopes?: import("discord-api-types/v10").OAuth2Scopes[] | undefined;
    guildId: string;
} | {
    user: import("../..").User;
    id: string;
    name: string;
    type: import("discord-api-types/v10").APIGuildIntegrationType;
    enabled: boolean;
    syncing?: boolean | undefined;
    roleId?: string | undefined;
    enableEmoticons?: boolean | undefined;
    expireBehavior?: import("discord-api-types/v10").IntegrationExpireBehavior | undefined;
    expireGracePeriod?: number | undefined;
    account: {
        id: string;
        name: string;
    };
    syncedAt?: string | undefined;
    subscriberCount?: number | undefined;
    revoked?: boolean | undefined;
    application?: {
        id: string;
        name: string;
        icon: string | null;
        description: string;
        bot?: import("discord-api-types/v10").APIUser | undefined;
    } | undefined;
    scopes?: import("discord-api-types/v10").OAuth2Scopes[] | undefined;
    guildId: string;
};
export declare const INTEGRATION_UPDATE: (self: UsingClient, data: GatewayIntegrationUpdateDispatchData) => {
    id: string;
    name: string;
    type: import("discord-api-types/v10").APIGuildIntegrationType;
    enabled: boolean;
    syncing?: boolean | undefined;
    roleId?: string | undefined;
    enableEmoticons?: boolean | undefined;
    expireBehavior?: import("discord-api-types/v10").IntegrationExpireBehavior | undefined;
    expireGracePeriod?: number | undefined;
    user?: {
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
    account: {
        id: string;
        name: string;
    };
    syncedAt?: string | undefined;
    subscriberCount?: number | undefined;
    revoked?: boolean | undefined;
    application?: {
        id: string;
        name: string;
        icon: string | null;
        description: string;
        bot?: import("discord-api-types/v10").APIUser | undefined;
    } | undefined;
    scopes?: import("discord-api-types/v10").OAuth2Scopes[] | undefined;
    guildId: string;
} | {
    user: import("../..").User;
    id: string;
    name: string;
    type: import("discord-api-types/v10").APIGuildIntegrationType;
    enabled: boolean;
    syncing?: boolean | undefined;
    roleId?: string | undefined;
    enableEmoticons?: boolean | undefined;
    expireBehavior?: import("discord-api-types/v10").IntegrationExpireBehavior | undefined;
    expireGracePeriod?: number | undefined;
    account: {
        id: string;
        name: string;
    };
    syncedAt?: string | undefined;
    subscriberCount?: number | undefined;
    revoked?: boolean | undefined;
    application?: {
        id: string;
        name: string;
        icon: string | null;
        description: string;
        bot?: import("discord-api-types/v10").APIUser | undefined;
    } | undefined;
    scopes?: import("discord-api-types/v10").OAuth2Scopes[] | undefined;
    guildId: string;
};
export declare const INTEGRATION_DELETE: (_self: UsingClient, data: GatewayIntegrationDeleteDispatchData) => {
    id: string;
    guildId: string;
    applicationId?: string | undefined;
};
