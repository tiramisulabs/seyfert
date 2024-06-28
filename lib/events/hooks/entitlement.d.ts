import type { APIEntitlement } from 'discord-api-types/v10';
import type { UsingClient } from '../../commands';
export declare const ENTITLEMENT_CREATE: (_: UsingClient, data: APIEntitlement) => {
    id: string;
    skuId: string;
    userId?: string | undefined;
    guildId?: string | undefined;
    applicationId: string;
    type: import("discord-api-types/v10").EntitlementType;
    deleted: boolean;
    startsAt?: string | undefined;
    endsAt?: string | undefined;
    consumed?: boolean | undefined;
};
export declare const ENTITLEMENT_UPDATE: (_: UsingClient, data: APIEntitlement) => {
    id: string;
    skuId: string;
    userId?: string | undefined;
    guildId?: string | undefined;
    applicationId: string;
    type: import("discord-api-types/v10").EntitlementType;
    deleted: boolean;
    startsAt?: string | undefined;
    endsAt?: string | undefined;
    consumed?: boolean | undefined;
};
export declare const ENTITLEMENT_DELETE: (_: UsingClient, data: APIEntitlement) => {
    id: string;
    skuId: string;
    userId?: string | undefined;
    guildId?: string | undefined;
    applicationId: string;
    type: import("discord-api-types/v10").EntitlementType;
    deleted: boolean;
    startsAt?: string | undefined;
    endsAt?: string | undefined;
    consumed?: boolean | undefined;
};
