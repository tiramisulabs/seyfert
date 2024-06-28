import type { GatewayActivity, GatewayPresenceUpdateDispatchData } from 'discord-api-types/v10';
export declare class PresenceUpdateHandler {
    presenceUpdate: Map<string, {
        timeout: NodeJS.Timeout;
        presence: GatewayPresenceUpdateDispatchData;
    }>;
    check(presence: GatewayPresenceUpdateDispatchData): boolean;
    setPresence(presence: GatewayPresenceUpdateDispatchData): void;
    presenceEquals(oldPresence: GatewayPresenceUpdateDispatchData, newPresence: GatewayPresenceUpdateDispatchData): boolean | undefined;
    activityEquals(oldActivity: GatewayActivity, newActivity: GatewayActivity): boolean;
}
