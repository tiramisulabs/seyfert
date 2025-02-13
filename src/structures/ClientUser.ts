import type { ClientUserStructure } from '../client';
import type { UsingClient } from '../commands';
import type { GatewayReadyDispatchData, RESTPatchAPICurrentUserJSONBody } from '../types';
import { User } from './User';

/**
 * Represents a client user that extends the base User class.
 * This class is used to interact with the authenticated user.
 *
 * @extends User
 */
export class ClientUser extends User {
	/**
	 * Indicates if the user is a bot.
	 * @type {true}
	 */
	bot = true;

	/**
	 * Creates an instance of ClientUser.
	 *
	 * @param client - The client instance used for making API requests.
	 * @param data - The user data received from the gateway.
	 * @param application - The application data received from the gateway.
	 */
	constructor(
		client: UsingClient,
		data: GatewayReadyDispatchData['user'],
		readonly application: GatewayReadyDispatchData['application'],
	) {
		super(client, data);
	}

	/**
	 * Fetches the current user data from the API.
	 *
	 * @returns A promise that resolves to the ClientUserStructure.
	 */
	async fetch(): Promise<ClientUserStructure> {
		const data = await this.api.users('@me').get();
		return this.__patchThis(data);
	}

	/**
	 * Edits the current user data.
	 *
	 * @param body - The data to update the user with.
	 * @returns A promise that resolves to the updated ClientUserStructure.
	 */
	async edit(body: RESTPatchAPICurrentUserJSONBody): Promise<ClientUserStructure> {
		const data = await this.api.users('@me').patch({ body });
		return this.__patchThis(data);
	}
}
