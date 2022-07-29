import type { Snowflake } from '../snowflakes';
import type { Session } from '../biscuit';

/**
 * Represents a Discord data model
 */
export interface Model {
	/** id of the model */
	id: Snowflake;
	/** reference to the client that instantiated the model */
	session: Session;
}
