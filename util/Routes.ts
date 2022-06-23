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

/** used to send messages */
export function CHANNEL_MESSAGES(channelId: Snowflake, options?: GetMessagesOptions) {
    let url = `/channels/${channelId}/messages?`;

    if (options) {
        if ("after" in options && options.after) url += `after=${options.after}`;
        if ("before" in options && options.before) url += `&before=${options.before}`;
        if ("around" in options && options.around) url += `&around=${options.around}`;
        if ("limit" in options && options.limit) url += `&limit=${options.limit}`;
    }

    return url;
}

/** used to edit messages */
export function CHANNEL_MESSAGE(channelId: Snowflake, messageId: Snowflake) {
    return `/channels/${channelId}/messages/${messageId}`;
}
