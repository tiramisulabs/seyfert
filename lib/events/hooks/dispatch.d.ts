import type { GatewayDispatchPayload, GatewayReadyDispatchData, GatewayResumedDispatch } from 'discord-api-types/v10';
import type { UsingClient } from '../../commands';
export declare const READY: (self: UsingClient, data: GatewayReadyDispatchData) => import("../..").ClientUser;
export declare const RESUMED: (_self: UsingClient, _data: GatewayResumedDispatch["d"]) => void;
export declare const RAW: (_self: UsingClient, data: GatewayDispatchPayload) => GatewayDispatchPayload;
