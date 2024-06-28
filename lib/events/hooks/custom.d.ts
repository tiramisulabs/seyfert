import type { ClientUserStructure } from '../../client/transformers';
import type { UsingClient } from '../../commands';
export declare const BOT_READY: (_self: UsingClient, me: ClientUserStructure) => import("../..").ClientUser;
export declare const WORKER_READY: (_self: UsingClient, me: ClientUserStructure) => import("../..").ClientUser;
