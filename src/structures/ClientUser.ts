import { type ClientUserStructure, Transformers } from '../client';
import type { UsingClient } from '../commands';
import type { GatewayReadyDispatchData, RESTPatchAPICurrentUserJSONBody } from '../types';
import { User } from './User';

export class ClientUser extends User {
	bot = true;
	constructor(
		client: UsingClient,
		data: GatewayReadyDispatchData['user'],
		public application: GatewayReadyDispatchData['application'],
	) {
		super(client, data);
	}

	async fetch(): Promise<ClientUserStructure> {
		const data = await this.api.users('@me').get();
		return Transformers.ClientUser(this.client, data, this.application);
	}

	async edit(body: RESTPatchAPICurrentUserJSONBody): Promise<ClientUserStructure> {
		const data = await this.api.users('@me').patch({ body });
		return Transformers.ClientUser(this.client, data, this.application);
	}
}
