import type {
    DiscordChannel,
    DiscordChannelPinsUpdate,
    DiscordEmoji,
    DiscordGuild,
    DiscordGuildBanAddRemove,
    DiscordGuildEmojisUpdate,
    DiscordGuildMemberAdd,
    DiscordGuildMemberRemove,
    DiscordGuildMemberUpdate,
    DiscordGuildRoleCreate,
    DiscordGuildRoleDelete,
    DiscordGuildRoleUpdate,
    DiscordIntegration,
    DiscordIntegrationDelete,
    DiscordInteraction,
    DiscordMessage,
    DiscordMessageDelete,
    DiscordMessageReactionAdd,
    DiscordMessageReactionRemove,
    DiscordMessageReactionRemoveAll,
    DiscordMessageReactionRemoveEmoji,
    DiscordReady,
    DiscordRole,
    // DiscordThreadMemberUpdate,
    // DiscordThreadMembersUpdate,
    DiscordThreadListSync,
    DiscordUser,
    DiscordWebhookUpdate,
} from "../discordeno/mod.ts";

import type { Snowflake } from "./Snowflake.ts";
import type { Session } from "./Session.ts";
import type { Channel } from "./structures/channels.ts";
import type { Interaction } from "./structures/interactions/InteractionFactory.ts";

import {
    ChannelFactory,
    GuildChannel,
    ThreadChannel,
} from "./structures/channels.ts";

import ThreadMember from "./structures/ThreadMember.ts";
import Member from "./structures/Member.ts";
import Message from "./structures/Message.ts";
import User from "./structures/User.ts";
import Integration from "./structures/Integration.ts";
import Guild from "./structures/guilds/Guild.ts";
import InteractionFactory from "./structures/interactions/InteractionFactory.ts";

export type RawHandler<T> = (...args: [Session, number, T]) => void;
export type Handler<T extends unknown[]> = (...args: T) => unknown;

export const READY: RawHandler<DiscordReady> = (session, shardId, payload) => {
    session.applicationId = payload.application.id;
    session.botId = payload.user.id;
    session.emit("ready", { ...payload, user: new User(session, payload.user) }, shardId);
};

export const MESSAGE_CREATE: RawHandler<DiscordMessage> = (session, _shardId, message) => {
    session.emit("messageCreate", new Message(session, message));
};

export const MESSAGE_UPDATE: RawHandler<DiscordMessage> = (session, _shardId, new_message) => {
    // message is partial
    if (!new_message.edited_timestamp) {
        const message = {
            // TODO: improve this
            // ...new_message,
            session,
            id: new_message.id,
            guildId: new_message.guild_id,
            channelId: new_message.channel_id,
        };

        // all methods of Message can run on partial messages
        // we aknowledge people that their callback could be partial but giving them all functions of Message
        Object.setPrototypeOf(message, Message.prototype);

        session.emit("messageUpdate", message);
        return;
    }

    session.emit("messageUpdate", new Message(session, new_message));
};

export const MESSAGE_DELETE: RawHandler<DiscordMessageDelete> = (session, _shardId, { id, channel_id, guild_id }) => {
    session.emit("messageDelete", { id, channelId: channel_id, guildId: guild_id });
};

export const GUILD_CREATE: RawHandler<DiscordGuild> = (session, _shardId, guild) => {
    session.emit("guildCreate", new Guild(session, guild));
};

export const GUILD_DELETE: RawHandler<DiscordGuild> = (session, _shardId, guild) => {
    session.emit("guildDelete", { id: guild.id, unavailable: true });
};

export const GUILD_MEMBER_ADD: RawHandler<DiscordGuildMemberAdd> = (session, _shardId, member) => {
    session.emit("guildMemberAdd", new Member(session, member, member.guild_id));
};

export const GUILD_MEMBER_UPDATE: RawHandler<DiscordGuildMemberUpdate> = (session, _shardId, member) => {
    session.emit("guildMemberUpdate", new Member(session, member, member.guild_id));
};

export const GUILD_MEMBER_REMOVE: RawHandler<DiscordGuildMemberRemove> = (session, _shardId, member) => {
    session.emit("guildMemberRemove", new User(session, member.user), member.guild_id);
};

export const GUILD_BAN_ADD: RawHandler<DiscordGuildBanAddRemove> = (session, _shardId, data) => {
    session.emit("guildBanAdd", { guildId: data.guild_id, user: data.user });
};

export const GUILD_BAN_REMOVE: RawHandler<DiscordGuildBanAddRemove> = (session, _shardId, data) => {
    session.emit("guildBanRemove", { guildId: data.guild_id, user: data.user });
};

export const GUILD_EMOJIS_UPDATE: RawHandler<DiscordGuildEmojisUpdate> = (session, _shardId, data) => {
    session.emit("guildEmojisUpdate", { guildId: data.guild_id, emojis: data.emojis });
};

export const GUILD_ROLE_CREATE: RawHandler<DiscordGuildRoleCreate> = (session, _shardId, data) => {
    session.emit("guildRoleCreate", { guildId: data.guild_id, role: data.role });
};

export const GUILD_ROLE_UPDATE: RawHandler<DiscordGuildRoleUpdate> = (session, _shardId, data) => {
    session.emit("guildRoleUpdate", { guildId: data.guild_id, role: data.role });
};

export const GUILD_ROLE_DELETE: RawHandler<DiscordGuildRoleDelete> = (session, _shardId, data) => {
    session.emit("guildRoleDelete", { guildId: data.guild_id, roleId: data.role_id });
};

export const INTERACTION_CREATE: RawHandler<DiscordInteraction> = (session, _shardId, interaction) => {
    session.emit("interactionCreate", InteractionFactory.from(session, interaction));
};

export const CHANNEL_CREATE: RawHandler<DiscordChannel> = (session, _shardId, channel) => {
    session.emit("channelCreate", ChannelFactory.from(session, channel));
};

export const CHANNEL_UPDATE: RawHandler<DiscordChannel> = (session, _shardId, channel) => {
    session.emit("channelUpdate", ChannelFactory.from(session, channel));
};

export const CHANNEL_DELETE: RawHandler<DiscordChannel> = (session, _shardId, channel) => {
    if (!channel.guild_id) return;

    session.emit("channelDelete", new GuildChannel(session, channel, channel.guild_id));
};

export const THREAD_CREATE: RawHandler<DiscordChannel> = (session, _shardId, channel) => {
    if (!channel.guild_id) return;

    session.emit("threadCreate", new ThreadChannel(session, channel, channel.guild_id));
};

export const THREAD_UPDATE: RawHandler<DiscordChannel> = (session, _shardId, channel) => {
    if (!channel.guild_id) return;

    session.emit("threadUpdate", new ThreadChannel(session, channel, channel.guild_id));
};

export const THREAD_DELETE: RawHandler<DiscordChannel> = (session, _shardId, channel) => {
    if (!channel.guild_id) return;

    session.emit("threadDelete", new ThreadChannel(session, channel, channel.guild_id));
};

export const THREAD_LIST_SYNC: RawHandler<DiscordThreadListSync> = (session, _shardId, payload) => {
    session.emit("threadListSync", {
        guildId: payload.guild_id,
        channelIds: payload.channel_ids ?? [],
        threads: payload.threads.map((channel) => new ThreadChannel(session, channel, payload.guild_id)),
        members: payload.members.map((member) => new ThreadMember(session, member)),
    });
};

export const CHANNEL_PINS_UPDATE: RawHandler<DiscordChannelPinsUpdate> = (session, _shardId, payload) => {
    session.emit("channelPinsUpdate", {
        guildId: payload.guild_id,
        channelId: payload.channel_id,
        lastPinTimestamp: payload.last_pin_timestamp ? Date.parse(payload.last_pin_timestamp) : undefined,
    });
};

export const WEBHOOKS_UPDATE: RawHandler<DiscordWebhookUpdate> = (session, _shardId, webhook) => {
    session.emit("webhooksUpdate", { guildId: webhook.guild_id, channelId: webhook.channel_id });
};

export const INTEGRATION_CREATE: RawHandler<DiscordIntegration & { guildId?: Snowflake }> = (
    session,
    _shardId,
    payload,
) => {
    session.emit("integrationCreate", new Integration(session, payload));
};

export const INTEGRATION_UPDATE: RawHandler<DiscordIntegration & { guildId?: Snowflake }> = (
    session,
    _shardId,
    payload,
) => {
    session.emit("integrationCreate", new Integration(session, payload));
};

export const INTEGRATION_DELETE: RawHandler<DiscordIntegrationDelete> = (session, _shardId, payload) => {
    session.emit("integrationDelete", {
        id: payload.id,
        guildId: payload.guild_id,
        applicationId: payload.application_id,
    });
};

export const MESSAGE_REACTION_ADD: RawHandler<DiscordMessageReactionAdd> = (session, _shardId, reaction) => {
    session.emit("messageReactionAdd", null);
};

export const MESSAGE_REACTION_REMOVE: RawHandler<DiscordMessageReactionRemove> = (session, _shardId, reaction) => {
    session.emit("messageReactionRemove", null);
};

export const MESSAGE_REACTION_REMOVE_ALL: RawHandler<DiscordMessageReactionRemoveAll> = (
    session,
    _shardId,
    reaction,
) => {
    session.emit("messageReactionRemoveAll", null);
};

export const MESSAGE_REACTION_REMOVE_EMOJI: RawHandler<DiscordMessageReactionRemoveEmoji> = (
    session,
    _shardId,
    reaction,
) => {
    session.emit("messageReactionRemoveEmoji", null);
};

export const raw: RawHandler<unknown> = (session, shardId, data) => {
    session.emit("raw", data, shardId);
};

export interface Ready extends Omit<DiscordReady, "user"> {
    user: User;
}

// TODO: add partial reactions or something
type MessageReaction = any;

// deno-fmt-ignore-file
export interface Events {
    "ready":                      Handler<[Ready, number]>;
    "messageCreate":              Handler<[Message]>;
    "messageUpdate":              Handler<[Partial<Message>]>;
    "messageDelete":              Handler<[{ id: Snowflake, channelId: Snowflake, guildId?: Snowflake }]>;
    "messageReactionAdd":         Handler<[MessageReaction]>;
    "messageReactionRemove":      Handler<[MessageReaction]>;  
    "messageReactionRemoveAll":   Handler<[MessageReaction]>;
    "messageReactionRemoveEmoji": Handler<[MessageReaction]>;
    "guildCreate":                Handler<[Guild]>;
    "guildDelete":                Handler<[{ id: Snowflake, unavailable: boolean }]>;
    "guildMemberAdd":             Handler<[Member]>;
    "guildMemberUpdate":          Handler<[Member]>;
    "guildMemberRemove":          Handler<[User, Snowflake]>;
    "guildBanAdd":                Handler<[{ guildId: Snowflake, user: DiscordUser}]>;
    "guildBanRemove":             Handler<[{ guildId: Snowflake, user: DiscordUser }]>
    "guildEmojisUpdate":          Handler<[{ guildId: Snowflake, emojis: DiscordEmoji[] }]>
    "guildRoleCreate":            Handler<[{ guildId: Snowflake, role: DiscordRole }]>;
    "guildRoleUpdate":            Handler<[{ guildId: Snowflake, role: DiscordRole }]>;
    "guildRoleDelete":            Handler<[{ guildId: Snowflake, roleId: Snowflake }]>;
    "channelCreate":              Handler<[Channel]>;
    "channelUpdate":              Handler<[Channel]>;
    "channelDelete":              Handler<[GuildChannel]>;
    "channelPinsUpdate":          Handler<[{ guildId?: Snowflake, channelId: Snowflake, lastPinTimestamp?: number }]>
    "threadCreate":               Handler<[ThreadChannel]>;
    "threadUpdate":               Handler<[ThreadChannel]>;
    "threadDelete":               Handler<[ThreadChannel]>;
    "threadListSync":             Handler<[{ guildId: Snowflake, channelIds: Snowflake[], threads: ThreadChannel[], members: ThreadMember[] }]>
    "interactionCreate":          Handler<[Interaction]>;
    "integrationCreate":          Handler<[Integration]>;
    "integrationUpdate":          Handler<[Integration]>;
    "integrationDelete":          Handler<[{ id: Snowflake, guildId?: Snowflake, applicationId?: Snowflake }]>;
    "raw":                        Handler<[unknown, number]>;
    "webhooksUpdate":             Handler<[{ guildId: Snowflake, channelId: Snowflake }]>;
}
