/** snowflake type */
export type Snowflake = string;

/** Discord epoch */
export const DiscordEpoch = 14200704e5;

/** utilities for Snowflakes */
// eslint-disable-next-line @typescript-eslint/no-redeclare
export const Snowflake = {
    snowflakeToTimestamp(id: Snowflake): number {
        return (Number(id) >> 22) + DiscordEpoch;
    },
};
