import type { GatewayReadyDispatchData, RESTPatchAPICurrentUserJSONBody } from 'discord-api-types/v10';
import type { UsingClient } from '../commands';
import { User } from './User';
export declare class ClientUser extends User {
    application: GatewayReadyDispatchData['application'];
    bot: boolean;
    constructor(client: UsingClient, data: GatewayReadyDispatchData['user'], application: GatewayReadyDispatchData['application']);
    fetch(): Promise<ClientUser>;
    edit(body: RESTPatchAPICurrentUserJSONBody): Promise<ClientUser>;
}
