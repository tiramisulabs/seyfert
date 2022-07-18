import type { Snowflake } from '../Snowflake.ts';
import type { Session } from '../Session.ts';

/**
 * Represents a Discord data model
 */
export interface Model {
    /** id of the model */
    id: Snowflake;
    /** reference to the client that instantiated the model */
    session: Session;
}
