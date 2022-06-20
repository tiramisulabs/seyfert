// snowflake type
export type Snowflake = string;

export const DiscordEpoch = 14200704e5;

// utilities for Snowflakes
export const Snowflake = {
	snowflakeToTimestamp(id: Snowflake) {
        return (Number(id) >> 22) + DiscordEpoch;
    }
}