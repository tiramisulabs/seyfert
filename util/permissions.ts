import { Snowflake } from "./Snowflake.ts";
import { Permissions } from "../structures/Permissions.ts";

export interface PermissionsOverwrites {
    id: Snowflake;
    type: 0 | 1;
    allow: Permissions;
    deny: Permissions;
}
