import type { Snowflake } from "./Snowflake.ts";

// cdn endpoints
export * from "./Cdn.ts";

export function USER(userId?: Snowflake): string {
    if (!userId) return "/users/@me";
    return `/users/${userId}`;
}

export function GATEWAY_BOT(): string  {
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

export function CHANNEL(channelId: Snowflake): string  {
    return `/channels/${channelId}`;
}

export function CHANNEL_INVITES(channelId: Snowflake): string  {
    return `/channels/${channelId}/invites`;
}

export function CHANNEL_TYPING(channelId: Snowflake): string  {
    return `/channels/${channelId}/typing`;
}

export function CHANNEL_CREATE_THREAD(channelId: Snowflake): string  {
    return `/channels/${channelId}/threads`;
}

export function MESSAGE_CREATE_THREAD(channelId: Snowflake, messageId: Snowflake): string  {
    return `/channels/${channelId}/messages/${messageId}/threads`;
}

/** used to send messages */
export function CHANNEL_MESSAGES(channelId: Snowflake, options?: GetMessagesOptions): string  {
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
export function CHANNEL_MESSAGE(channelId: Snowflake, messageId: Snowflake): string  {
    return `/channels/${channelId}/messages/${messageId}`;
}

/** used to kick members */
export function GUILD_MEMBER(guildId: Snowflake, userId: Snowflake): string  {
    return `/guilds/${guildId}/members/${userId}`;
}

/** used to ban members */
export function GUILD_BAN(guildId: Snowflake, userId: Snowflake): string  {
    return `/guilds/${guildId}/bans/${userId}`;
}

export interface GetBans {
    limit?: number;
    before?: Snowflake;
    after?: Snowflake;
}

/** used to unban members */
export function GUILD_BANS(guildId: Snowflake, options?: GetBans): string  {
    let url = `/guilds/${guildId}/bans?`;

    if (options) {
        if (options.limit) url += `limit=${options.limit}`;
        if (options.after) url += `&after=${options.after}`;
        if (options.before) url += `&before=${options.before}`;
    }

    return url;
}

export function GUILD_ROLE(guildId: Snowflake, roleId: Snowflake): string  {
    return `/guilds/${guildId}/roles/${roleId}`;
}

export function GUILD_ROLES(guildId: Snowflake): string  {
    return `/guilds/${guildId}/roles`;
}

export function USER_DM() {
    return `/users/@me/channels`;
}

export function GUILD_EMOJIS(guildId: Snowflake): string  {
    return `/guilds/${guildId}/emojis`;
}

export function GUILD_EMOJI(guildId: Snowflake, emojiId: Snowflake): string  {
    return `/guilds/${guildId}/emojis/${emojiId}`;
}

export interface GetInvite {
    withCounts?: boolean;
    withExpiration?: boolean;
    scheduledEventId?: Snowflake;
}

export function GUILDS(): string  {
    return `/guilds`;
}

export function AUTO_MODERATION_RULES(guildId: Snowflake, ruleId?: Snowflake): string  {
    if (ruleId) {
        return `/guilds/${guildId}/auto-moderation/rules/${ruleId}`;
    }
    return `/guilds/${guildId}/auto-moderation/rules`;
}

export function INVITE(inviteCode: string, options?: GetInvite): string  {
    let url = `/invites/${inviteCode}?`;

    if (options) {
        if (options.withCounts) url += `with_counts=${options.withCounts}`;
        if (options.withExpiration) url += `&with_expiration=${options.withExpiration}`;
        if (options.scheduledEventId) url += `&guild_scheduled_event_id=${options.scheduledEventId}`;
    }

    return url;
}

export function GUILD_INVITES(guildId: Snowflake): string  {
    return `/guilds/${guildId}/invites`;
}

export function INTERACTION_ID_TOKEN(interactionId: Snowflake, token: string): string  {
    return `/interactions/${interactionId}/${token}/callback`;
}

export function WEBHOOK_MESSAGE_ORIGINAL(webhookId: Snowflake, token: string, options?: { threadId?: bigint }): string {
    let url = `/webhooks/${webhookId}/${token}/messages/@original?`;

    if (options) {
        if (options.threadId) url += `threadId=${options.threadId}`;
    }

    return url;
}

export function WEBHOOK_MESSAGE(
    webhookId: Snowflake,
    token: string,
    messageId: Snowflake,
    options?: { threadId?: Snowflake }
): string {
    let url = `/webhooks/${webhookId}/${token}/messages/${messageId}?`;

    if (options) {
        if (options.threadId) url += `threadId=${options.threadId}`;
    }

    return url;
}

export function WEBHOOK_TOKEN(webhookId: Snowflake, token?: string): string  {
    if (!token) return `/webhooks/${webhookId}`;
    return `/webhooks/${webhookId}/${token}`;
}

export interface WebhookOptions {
    wait?: boolean;
    threadId?: Snowflake;
}

export function WEBHOOK(webhookId: Snowflake, token: string, options?: WebhookOptions): string  {
    let url = `/webhooks/${webhookId}/${token}`;

    if (options?.wait) url += `?wait=${options.wait}`;
    if (options?.threadId) url += `?threadId=${options.threadId}`;
    if (options?.wait && options.threadId) url += `?wait=${options.wait}&threadId=${options.threadId}`;

    return url;
}

export function USER_NICK(guildId: Snowflake): string  {
    return `/guilds/${guildId}/members/@me`;
}

/**
 * @link https://discord.com/developers/docs/resources/guild#get-guild-prune-count
 */
export interface GetGuildPruneCountQuery {
    days?: number;
    includeRoles?: Snowflake | Snowflake[];
}

export function GUILD_PRUNE(guildId: Snowflake, options?: GetGuildPruneCountQuery): string  {
    let url = `/guilds/${guildId}/prune?`;

    if (options?.days) url += `days=${options.days}`;
    if (options?.includeRoles) url += `&include_roles=${options.includeRoles}`;

    return url;
}

export function CHANNEL_PIN(channelId: Snowflake, messageId: Snowflake): string  {
    return `/channels/${channelId}/pins/${messageId}`;
}

export function CHANNEL_PINS(channelId: Snowflake): string  {
    return `/channels/${channelId}/pins`;
}

export function CHANNEL_MESSAGE_REACTION_ME(channelId: Snowflake, messageId: Snowflake, emoji: string): string  {
    return `/channels/${channelId}/messages/${messageId}/reactions/${encodeURIComponent(emoji)}/@me`;
}

export function CHANNEL_MESSAGE_REACTION_USER(
    channelId: Snowflake,
    messageId: Snowflake,
    emoji: string,
    userId: Snowflake,
) {
    return `/channels/${channelId}/messages/${messageId}/reactions/${encodeURIComponent(emoji)}/${userId}`;
}

export function CHANNEL_MESSAGE_REACTIONS(channelId: Snowflake, messageId: Snowflake) {
    return `/channels/${channelId}/messages/${messageId}/reactions`;
}

/**
 * @link https://discord.com/developers/docs/resources/channel#get-reactions-query-string-params
 */
export interface GetReactions {
    after?: string;
    limit?: number;
}

export function CHANNEL_MESSAGE_REACTION(
    channelId: Snowflake,
    messageId: Snowflake,
    emoji: string,
    options?: GetReactions,
): string  {
    let url = `/channels/${channelId}/messages/${messageId}/reactions/${encodeURIComponent(emoji)}?`;

    if (options?.after) url += `after=${options.after}`;
    if (options?.limit) url += `&limit=${options.limit}`;

    return url;
}

export function CHANNEL_MESSAGE_CROSSPOST(channelId: Snowflake, messageId: Snowflake): string  {
    return `/channels/${channelId}/messages/${messageId}/crosspost`;
}

export function GUILD_MEMBER_ROLE(guildId: Snowflake, memberId: Snowflake, roleId: Snowflake): string  {
    return `/guilds/${guildId}/members/${memberId}/roles/${roleId}`;
}

export function CHANNEL_WEBHOOKS(channelId: Snowflake): string  {
    return `/channels/${channelId}/webhooks`;
}

export function THREAD_START_PUBLIC(channelId: Snowflake, messageId: Snowflake): string  {
    return `/channels/${channelId}/messages/${messageId}/threads`;
}

export function THREAD_START_PRIVATE(channelId: Snowflake): string  {
    return `/channels/${channelId}/threads`;
}

export function THREAD_ACTIVE(guildId: Snowflake): string  {
    return `/guilds/${guildId}/threads/active`;
}

export interface ListArchivedThreads {
    before?: number;
    limit?: number;
}

export function THREAD_ME(channelId: Snowflake): string  {
    return `/channels/${channelId}/thread-members/@me`;
}

export function THREAD_MEMBERS(channelId: Snowflake): string  {
    return `/channels/${channelId}/thread-members`;
}

export function THREAD_USER(channelId: Snowflake, userId: Snowflake): string  {
    return `/channels/${channelId}/thread-members/${userId}`;
}

export function THREAD_ARCHIVED(channelId: Snowflake): string  {
    return `/channels/${channelId}/threads/archived`;
}

export function THREAD_ARCHIVED_PUBLIC(channelId: Snowflake, options?: ListArchivedThreads): string  {
    let url = `/channels/${channelId}/threads/archived/public?`;

    if (options) {
        if (options.before) url += `before=${new Date(options.before).toISOString()}`;
        if (options.limit) url += `&limit=${options.limit}`;
    }

    return url;
}

export function THREAD_ARCHIVED_PRIVATE(channelId: Snowflake, options?: ListArchivedThreads): string  {
    let url = `/channels/${channelId}/threads/archived/private?`;

    if (options) {
        if (options.before) url += `before=${new Date(options.before).toISOString()}`;
        if (options.limit) url += `&limit=${options.limit}`;
    }

    return url;
}

export function THREAD_ARCHIVED_PRIVATE_JOINED(channelId: Snowflake, options?: ListArchivedThreads): string  {
    let url = `/channels/${channelId}/users/@me/threads/archived/private?`;

    if (options) {
        if (options.before) url += `before=${new Date(options.before).toISOString()}`;
        if (options.limit) url += `&limit=${options.limit}`;
    }

    return url;
}

export function FORUM_START(channelId: Snowflake): string  {
    return `/channels/${channelId}/threads?has_message=true`;
}

export function STAGE_INSTANCES(): string  {
    return `/stage-instances`;
}

export function STAGE_INSTANCE(channelId: Snowflake): string  {
    return `/stage-instances/${channelId}`;
}

export function APPLICATION_COMMANDS(appId: Snowflake, commandId?: Snowflake): string  {
    if (commandId) return `/applications/${appId}/commands/${commandId}`;
    return `/applications/${appId}/commands`;
}

export function GUILD_APPLICATION_COMMANDS(appId: Snowflake, guildId: Snowflake, commandId?: Snowflake): string  {
    if (commandId) return `/applications/${appId}/guilds/${guildId}/commands/${commandId}`;
    return `/applications/${appId}/guilds/${guildId}/commands`;
}

export function GUILD_APPLICATION_COMMANDS_PERMISSIONS(appId: Snowflake, guildId: Snowflake, commandId?: Snowflake): string  {
    if (commandId) return `/applications/${appId}/guilds/${guildId}/commands/${commandId}/permissions`;
    return `/applications/${appId}/guilds/${guildId}/commands/permissions`;
}

export function APPLICATION_COMMANDS_LOCALIZATIONS(
    appId: Snowflake,
    commandId: Snowflake,
    withLocalizations?: boolean,
): string  {
    let url = `/applications/${appId}/commands/${commandId}?`;

    if (withLocalizations !== undefined) {
        url += `withLocalizations=${withLocalizations}`;
    }

    return url;
}

export function GUILD_APPLICATION_COMMANDS_LOCALIZATIONS(
    appId: Snowflake,
    guildId: Snowflake,
    commandId: Snowflake,
    withLocalizations?: boolean,
): string  {
    let url = `/applications/${appId}/guilds/${guildId}/commands/${commandId}?`;

    if (withLocalizations !== undefined) {
        url += `with_localizations=${withLocalizations}`;
    }

    return url;
}

export function STICKER(id: Snowflake): string  {
    return `stickers/${id}`;
}

export function STICKER_PACKS(): string  {
    return `stickers-packs`;
}

export function GUILD_STICKERS(guildId: Snowflake, stickerId?: Snowflake): string  {
    if (stickerId) return `/guilds/${guildId}/stickers/${stickerId}`;
    return `/guilds/${guildId}/stickers`;
}
