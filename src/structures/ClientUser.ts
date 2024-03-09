import type { BaseClient } from '../client/base';
import type { GatewayReadyDispatchData, RESTPatchAPICurrentUserJSONBody } from '../common';
import { User } from './User';

export class ClientUser extends User {
	bot = true;
	constructor(
		client: BaseClient,
		data: GatewayReadyDispatchData['user'],
		public application: GatewayReadyDispatchData['application'],
	) {
		super(client, data);
	}

	async fetch() {
		const data = await this.api.users('@me').get();
		return new ClientUser(this.client, data, this.application);
	}

	async edit(body: RESTPatchAPICurrentUserJSONBody) {
		const data = await this.api.users('@me').patch({ body });
		return new ClientUser(this.client, data, this.application);
	}
}
