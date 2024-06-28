import type { GatewayApplicationCommandPermissionsUpdateDispatchData } from 'discord-api-types/v10';
import type { UsingClient } from '../../commands';
export declare const APPLICATION_COMMAND_PERMISSIONS_UPDATE: (_self: UsingClient, data: GatewayApplicationCommandPermissionsUpdateDispatchData) => {
    id: string;
    applicationId: string;
    guildId: string;
    permissions: {
        id: string;
        type: import("discord-api-types/v10").ApplicationCommandPermissionType;
        permission: boolean;
    }[];
};
