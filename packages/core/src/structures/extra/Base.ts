import { snowflakeToTimestamp } from "../../utils/utils";
import type { Session } from "../../session";
/**
 *
 */
export class Base {
	constructor(
		// rome-ignore lint/correctness/noUnusedVariables: Declaring them here avoids reassigning them manually
		readonly session: Session,

		/** Unique ID of the object */
		// rome-ignore lint/correctness/noUnusedVariables: Declaring them here avoids reassigning them manually
		readonly id?: string,
	) {}

	/**
	 * Create a timestamp for the current object.
	 */
	get createdTimestamp(): number | null {
		return this.id ? snowflakeToTimestamp(this.id) : null;
	}

	/**
	 * createdAt gets the creation Date instace of the current object.
	 */
	get createdAt(): Date | null {
		const timestamp = this.createdTimestamp;
		return timestamp ? new Date(timestamp) : null;
	}
}
