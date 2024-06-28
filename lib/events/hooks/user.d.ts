import type { GatewayUserUpdateDispatchData } from 'discord-api-types/v10';
import type { UsingClient } from '../../commands';
import { type UserStructure } from '../../client/transformers';
export declare const USER_UPDATE: (self: UsingClient, data: GatewayUserUpdateDispatchData) => Promise<[user: UserStructure, old?: UserStructure]>;
