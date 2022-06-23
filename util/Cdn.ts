import type { Snowflake } from "./Snowflake.ts";
import { baseEndpoints as Endpoints } from "../vendor/external.ts";

export function USER_AVATAR(userId: Snowflake, icon: string) {
    return `${Endpoints.CDN_URL}/avatars/${userId}/${icon}`;
}

export function USER_DEFAULT_AVATAR(
    /** user discriminator */
    altIcon: number,
) {
    return `${Endpoints.CDN_URL}/embed/avatars/${altIcon}.png`;
}
