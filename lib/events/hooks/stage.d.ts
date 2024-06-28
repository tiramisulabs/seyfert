import type { GatewayStageInstanceCreateDispatchData, GatewayStageInstanceDeleteDispatchData, GatewayStageInstanceUpdateDispatchData } from 'discord-api-types/v10';
import type { UsingClient } from '../../commands';
import { type ObjectToLower } from '../../common';
import type { StageInstances } from '../../cache/resources/stage-instances';
export declare const STAGE_INSTANCE_CREATE: (_self: UsingClient, data: GatewayStageInstanceCreateDispatchData) => {
    id: string;
    guildId: string;
    channelId: string;
    topic: string;
    privacyLevel: import("discord-api-types/v10").StageInstancePrivacyLevel;
    discoverableDisabled: boolean;
    guildScheduledEventId?: string | undefined;
};
export declare const STAGE_INSTANCE_DELETE: (_self: UsingClient, data: GatewayStageInstanceDeleteDispatchData) => {
    id: string;
    guildId: string;
    channelId: string;
    topic: string;
    privacyLevel: import("discord-api-types/v10").StageInstancePrivacyLevel;
    discoverableDisabled: boolean;
    guildScheduledEventId?: string | undefined;
};
export declare const STAGE_INSTANCE_UPDATE: (self: UsingClient, data: GatewayStageInstanceUpdateDispatchData) => Promise<[stage: ObjectToLower<GatewayStageInstanceUpdateDispatchData>, old?: ReturnType<StageInstances["get"]>]>;
