import { Session, snowflakeToTimestamp } from '../../index';
import { Base } from './Base';

export class DiscordBase extends Base {
	constructor(
		session: Session,
		/** Unique ID of the object */
		// rome-ignore lint/correctness/noUnusedVariables: Declaring them here avoids reassigning them manually
		readonly id: string
	) {
		super(session);
	}

	/**
	 * Create a timestamp for the current object.
	 */
	get createdTimestamp(): number {
		return snowflakeToTimestamp(this.id);
	}

	/**
	 * createdAt gets the creation Date instace of the current object.
	 */
	get createdAt(): Date | null {
		return new Date(this.createdTimestamp);
	}
}
