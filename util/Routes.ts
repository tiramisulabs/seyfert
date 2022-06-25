import type { Snowflake } from "./Snowflake.ts";

// cdn endpoints
export * from "./Cdn.ts";

export function GATEWAY_BOT() {
    return "/gateway/bot";
}

export interface GetMessagesOptions {
    limit?: number;
}

export interface GetMessagesOptions {
    around?: Snowflake;
    limit?: number;
}

export interface GetMessagesOptions {
    before?: Snowflake;
    limit?: number;
}

export interface GetMessagesOptions {
    after?: Snowflake;
    limit?: number;
}

export function CHANNEL(channelId: Snowflake) {
    return `/channels/${channelId}`;
}

export function CHANNEL_INVITES(channelId: Snowflake) {
    return `/channels/${channelId}/invites`;
}

export function CHANNEL_TYPING(channelId: Snowflake) {
    return `/channels/${channelId}/typing`;
}

export function CHANNEL_CREATE_THREAD(channelId: Snowflake) {
    return `/channels/${channelId}/threads`;
}

export function MESSAGE_CREATE_THREAD(channelId: Snowflake, messageId: Snowflake) {
    return `/channels/${channelId}/messages/${messageId}/threads`;
}

export function CHANNEL_PINS(channelId: Snowflake) {
    return `/channels/${channelId}/pins`;
}

/** used to send messages */
export function CHANNEL_MESSAGES(channelId: Snowflake, options?: GetMessagesOptions) {
    let url = `/channels/${channelId}/messages?`;

    if (options) {
        if (options.after) url += `after=${options.after}`;
        if (options.before) url += `&before=${options.before}`;
        if (options.around) url += `&around=${options.around}`;
        if (options.limit) url += `&limit=${options.limit}`;
    }

    return url;
}

/** used to edit messages */
export function CHANNEL_MESSAGE(channelId: Snowflake, messageId: Snowflake) {
    return `/channels/${channelId}/messages/${messageId}`;
}

/** used to kick members */
export function GUILD_MEMBER(guildId: Snowflake, userId: Snowflake) {
    return `/guilds/${guildId}/members/${userId}`;
}

/** used to ban members */
export function GUILD_BAN(guildId: Snowflake, userId: Snowflake) {
    return `/guilds/${guildId}/bans/${userId}`;
}

export interface GetBans {
    limit?: number;
    before?: Snowflake;
    after?: Snowflake;
}

/** used to unban members */
export function GUILD_BANS(guildId: Snowflake, options?: GetBans) {
    let url = `/guilds/${guildId}/bans?`;

    if (options) {
        if (options.limit) url += `limit=${options.limit}`;
        if (options.after) url += `&after=${options.after}`;
        if (options.before) url += `&before=${options.before}`;
    }

    return url;
}

export function GUILD_ROLE(guildId: Snowflake, roleId: Snowflake) {
    return `/guilds/${guildId}/roles/${roleId}`;
}

export function GUILD_ROLES(guildId: Snowflake) {
    return `/guilds/${guildId}/roles`;
}
