import type { Snowflake } from "../util/mod.ts";
import type { Session } from "../session/mod.ts";

/**
 * Represents a Discord data model
 */
export interface Model {
    /** id of the model */
    id: Snowflake;
    /** reference to the client that instantiated the model */
    session: Session;
}
