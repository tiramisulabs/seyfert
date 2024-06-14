import type { UsingClient } from '../../commands';
import { Base } from './Base';
import { snowflakeToTimestamp } from './functions';

export class DiscordBase<Data extends Record<string, any> = { id: string }> extends Base {
	id: string;
	constructor(
		client: UsingClient,
		/** Unique ID of the object */
		data: Data,
	) {
		super(client);
		this.id = data.id;
		this.__patchThis(data);
	}

	/**
	 * Create a timestamp for the current object.
	 */
	get createdTimestamp() {
		return Number(snowflakeToTimestamp(this.id));
	}

	/**
	 * createdAt gets the creation Date instace of the current object.
	 */
	get createdAt() {
		return new Date(this.createdTimestamp);
	}
}
