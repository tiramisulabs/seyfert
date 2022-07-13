import type {
    DiscordAutoModerationActionExecution,
    DiscordAutoModerationRule,
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
    DiscordInviteCreate,
    DiscordInviteDelete,
    DiscordMemberWithUser,
    DiscordMessage,
    DiscordMessageDelete,
    DiscordMessageReactionAdd,
    DiscordMessageReactionRemove,
    DiscordMessageReactionRemoveAll,
    DiscordMessageReactionRemoveEmoji,
    DiscordPresenceUpdate,
    DiscordReady,
    DiscordRole,
    DiscordScheduledEvent,
    DiscordScheduledEventUserAdd,
    DiscordScheduledEventUserRemove,
    DiscordThreadListSync,
    DiscordThreadMembersUpdate,
    DiscordThreadMemberUpdate,
    DiscordTypingStart,
    DiscordUser,
    DiscordWebhookUpdate,
} from "../discordeno/mod.ts";

import type { Snowflake } from "./Snowflake.ts";
import type { Session } from "./Session.ts";
import type { Interaction } from "./structures/interactions/InteractionFactory.ts";

import { AutoModerationRule } from "./structures/AutoModerationRule.ts";
import { AutoModerationExecution } from "./structures/AutoModerationExecution.ts";
import { type Channel, ChannelFactory, GuildChannel, ThreadChannel } from "./structures/channels.ts";
import { type DiscordStageInstance, StageInstance } from "./structures/StageInstance.ts";
import { ScheduledEvent } from "./structures/GuildScheduledEvent.ts";
import { Presence } from "./structures/Presence.ts";

import ThreadMember from "./structures/ThreadMember.ts";
import Member from "./structures/Member.ts";
import Message from "./structures/Message.ts";
import User from "./structures/User.ts";
import Integration from "./structures/Integration.ts";
import Guild from "./structures/guilds/Guild.ts";
import InteractionFactory from "./structures/interactions/InteractionFactory.ts";
import { InviteCreate, NewInviteCreate } from "./structures/Invite.ts";
import {
    MessageReactionAdd,
    MessageReactionRemove,
    MessageReactionRemoveAll,
    MessageReactionRemoveEmoji,
    NewMessageReactionAdd,
} from "./structures/MessageReaction.ts";

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

export const TYPING_START: RawHandler<DiscordTypingStart> = (session, _shardId, payload) => {
    session.emit("typingStart", {
        channelId: payload.channel_id,
        guildId: payload.guild_id ? payload.guild_id : undefined,
        userId: payload.user_id,
        timestamp: payload.timestamp,
        member: payload.guild_id
            ? new Member(session, payload.member as DiscordMemberWithUser, payload.guild_id)
            : undefined,
    });
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

export const THREAD_MEMBER_UPDATE: RawHandler<DiscordThreadMemberUpdate> = (session, _shardId, payload) => {
    session.emit("threadMemberUpdate", {
        guildId: payload.guild_id,
        id: payload.id,
        userId: payload.user_id,
        joinedAt: payload.joined_at,
        flags: payload.flags,
    });
};

export const THREAD_MEMBERS_UPDATE: RawHandler<DiscordThreadMembersUpdate> = (session, _shardId, payload) => {
    session.emit("threadMembersUpdate", {
        memberCount: payload.member_count,
        addedMembers: payload.added_members
            ? payload.added_members.map((tm) => new ThreadMember(session, tm))
            : undefined,
        removedMemberIds: payload.removed_member_ids ? payload.removed_member_ids : undefined,
        guildId: payload.guild_id,
        id: payload.id,
    });
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

export const USER_UPDATE: RawHandler<DiscordUser> = (session, _shardId, payload) => {
    session.emit("userUpdate", new User(session, payload));
};

export const PRESENCE_UPDATE: RawHandler<DiscordPresenceUpdate> = (session, _shardId, payload) => {
    session.emit("presenceUpdate", new Presence(session, payload));
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

export const AUTO_MODERATION_RULE_CREATE: RawHandler<DiscordAutoModerationRule> = (session, _shardId, payload) => {
    session.emit("autoModerationRuleCreate", new AutoModerationRule(session, payload));
};

export const AUTO_MODERATION_RULE_UPDATE: RawHandler<DiscordAutoModerationRule> = (session, _shardId, payload) => {
    session.emit("autoModerationRuleUpdate", new AutoModerationRule(session, payload));
};

export const AUTO_MODERATION_RULE_DELETE: RawHandler<DiscordAutoModerationRule> = (session, _shardId, payload) => {
    session.emit("autoModerationRuleDelete", new AutoModerationRule(session, payload));
};

export const AUTO_MODERATION_ACTION_EXECUTE: RawHandler<DiscordAutoModerationActionExecution> = (
    session,
    _shardId,
    payload,
) => {
    session.emit("autoModerationActionExecution", new AutoModerationExecution(session, payload));
};

export const MESSAGE_REACTION_ADD: RawHandler<DiscordMessageReactionAdd> = (session, _shardId, reaction) => {
    session.emit("messageReactionAdd", NewMessageReactionAdd(session, reaction));
};

export const MESSAGE_REACTION_REMOVE: RawHandler<DiscordMessageReactionRemove> = (session, _shardId, reaction) => {
    session.emit("messageReactionRemove", NewMessageReactionAdd(session, reaction));
};

export const MESSAGE_REACTION_REMOVE_ALL: RawHandler<DiscordMessageReactionRemoveAll> = (
    session,
    _shardId,
    reaction,
) => {
    session.emit("messageReactionRemoveAll", NewMessageReactionAdd(session, reaction as DiscordMessageReactionAdd));
};

export const MESSAGE_REACTION_REMOVE_EMOJI: RawHandler<DiscordMessageReactionRemoveEmoji> = (
    session,
    _shardId,
    reaction,
) => {
    session.emit("messageReactionRemoveEmoji", NewMessageReactionAdd(session, reaction as DiscordMessageReactionAdd));
};

export const INVITE_CREATE: RawHandler<DiscordInviteCreate> = (session, _shardId, invite) => {
    session.emit("inviteCreate", NewInviteCreate(session, invite));
};

export const INVITE_DELETE: RawHandler<DiscordInviteDelete> = (session, _shardId, data) => {
    session.emit("inviteDelete", { channelId: data.channel_id, guildId: data.guild_id, code: data.code });
};

export const STAGE_INSTANCE_CREATE: RawHandler<DiscordStageInstance> = (session, _shardId, payload) => {
    session.emit("stageInstanceCreate", new StageInstance(session, payload));
};

export const STAGE_INSTANCE_UPDATE: RawHandler<DiscordStageInstance> = (session, _shardId, payload) => {
    session.emit("stageInstanceUpdate", new StageInstance(session, payload));
};

export const STAGE_INSTANCE_DELETE: RawHandler<DiscordStageInstance> = (session, _shardId, payload) => {
    session.emit("stageInstanceDelete", new StageInstance(session, payload));
};

export const GUILD_SCHEDULED_EVENT_CREATE: RawHandler<DiscordScheduledEvent> = (session, _shardId, payload) => {
    session.emit("guildScheduledEventCreate", new ScheduledEvent(session, payload));
};

export const GUILD_SCHEDULED_EVENT_UPDATE: RawHandler<DiscordScheduledEvent> = (session, _shardId, payload) => {
    session.emit("guildScheduledEventUpdate", new ScheduledEvent(session, payload));
};

export const GUILD_SCHEDULED_EVENT_DELETE: RawHandler<DiscordScheduledEvent> = (session, _shardId, payload) => {
    session.emit("guildScheduledEventDelete", new ScheduledEvent(session, payload));
};

export const GUILD_SCHEDULED_EVENT_USER_ADD: RawHandler<DiscordScheduledEventUserAdd> = (
    session,
    _shardId,
    payload,
) => {
    session.emit("guildScheduledEventUserAdd", {
        scheduledEventId: payload.guild_scheduled_event_id,
        userId: payload.user_id,
        guildId: payload.guild_id,
    });
};

export const GUILD_SCHEDULED_EVENT_USER_REMOVE: RawHandler<DiscordScheduledEventUserRemove> = (
    session,
    _shardId,
    payload,
) => {
    session.emit("guildScheduledEventUserRemove", {
        scheduledEventId: payload.guild_scheduled_event_id,
        userId: payload.user_id,
        guildId: payload.guild_id,
    });
};

export const raw: RawHandler<unknown> = (session, shardId, data) => {
    session.emit("raw", data as { t: string; d: unknown }, shardId);
};

export interface Ready extends Omit<DiscordReady, "user"> {
    user: User;
}

// deno-fmt-ignore-file
export interface Events {
    "ready":                      Handler<[Ready, number]>;
    "messageCreate":              Handler<[Message]>;
    "messageUpdate":              Handler<[Partial<Message>]>;
    "messageDelete":              Handler<[{ id: Snowflake, channelId: Snowflake, guildId?: Snowflake }]>;
    "messageReactionAdd":         Handler<[MessageReactionAdd]>;
    "messageReactionRemove":      Handler<[MessageReactionRemove]>;  
    "messageReactionRemoveAll":   Handler<[MessageReactionRemoveAll]>;
    "messageReactionRemoveEmoji": Handler<[MessageReactionRemoveEmoji]>;
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
    "typingStart":                Handler<[{channelId: Snowflake, guildId?: Snowflake, userId: Snowflake, timestamp: number, member?: Member}]>
    "channelCreate":              Handler<[Channel]>;
    "channelUpdate":              Handler<[Channel]>;
    "channelDelete":              Handler<[GuildChannel]>;
    "channelPinsUpdate":          Handler<[{ guildId?: Snowflake, channelId: Snowflake, lastPinTimestamp?: number }]>
    "threadCreate":               Handler<[ThreadChannel]>;
    "threadUpdate":               Handler<[ThreadChannel]>;
    "threadDelete":               Handler<[ThreadChannel]>;
    "threadListSync":             Handler<[{ guildId: Snowflake, channelIds: Snowflake[], threads: ThreadChannel[], members: ThreadMember[] }]>
    "threadMemberUpdate":         Handler<[{id: Snowflake, userId: Snowflake, guildId: Snowflake, joinedAt: string, flags: number }]>
    "threadMembersUpdate":        Handler<[{id: Snowflake, memberCount: number, addedMembers?: ThreadMember[], guildId: Snowflake, removedMemberIds?: Snowflake[]}]>
    "interactionCreate":          Handler<[Interaction]>;
    "integrationCreate":          Handler<[Integration]>;
    "integrationUpdate":          Handler<[Integration]>;
    "integrationDelete":          Handler<[{ id: Snowflake, guildId?: Snowflake, applicationId?: Snowflake }]>;
    "inviteCreate":               Handler<[InviteCreate]>;
    "inviteDelete":               Handler<[{ channelId: string, guildId?: string, code: string }]>;
    "autoModerationRuleCreate":   Handler<[AutoModerationRule]>;
    "autoModerationRuleUpdate":   Handler<[AutoModerationRule]>;
    "autoModerationRuleDelete":   Handler<[AutoModerationRule]>;
    "autoModerationActionExecution":Handler<[AutoModerationExecution]>
    "stageInstanceCreate":        Handler<[StageInstance]>;
    "stageInstanceUpdate":        Handler<[StageInstance]>;
    "stageInstanceDelete":        Handler<[StageInstance]>;
    "guildScheduledEventCreate":  Handler<[ScheduledEvent]>;
    "guildScheduledEventUpdate":  Handler<[ScheduledEvent]>;
    "guildScheduledEventDelete":  Handler<[ScheduledEvent]>;
    "guildScheduledEventUserAdd": Handler<[{scheduledEventId: Snowflake, userId: Snowflake, guildId: Snowflake}]>
    "guildScheduledEventUserRemove": Handler<[{scheduledEventId: Snowflake, userId: Snowflake, guildId: Snowflake}]>
    "raw":                        Handler<[{ t: string, d: unknown }, number]>;
    "webhooksUpdate":             Handler<[{ guildId: Snowflake, channelId: Snowflake }]>;
    "userUpdate":                 Handler<[User]>;
    "presenceUpdate":             Handler<[Presence]>;
}
