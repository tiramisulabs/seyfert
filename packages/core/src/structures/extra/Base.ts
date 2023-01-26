import { snowflakeToTimestamp } from '../../utils/utils';
import type { Session } from '../../session';
/**
 *
 */
export class Base {
	constructor(
		// rome-ignore lint/correctness/noUnusedVariables: Declaring them here avoids reassigning them manually
		readonly session: Session,

		/** Unique ID of the object */
		// rome-ignore lint/correctness/noUnusedVariables: Declaring them here avoids reassigning them manually
		readonly id: string
	) {}

	/**
	 * Create a timestamp for the current object.
	 */
	get createdTimestamp(): number {
		return snowflakeToTimestamp(this.id);
	}

	/**
	 * createdAt gets the creation Date instace of the current object.
	 */
	get createdAt(): Date {
		return new Date(this.createdTimestamp);
	}
}
