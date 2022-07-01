import type {
    DiscordGuildMemberAdd,
    DiscordGuildMemberRemove,
    DiscordGuildMemberUpdate,
    DiscordInteraction,
    DiscordMessage,
    DiscordMessageDelete,
    DiscordReady,
} from "../vendor/external.ts";
import type { Snowflake } from "../util/Snowflake.ts";
import type { Session } from "../session/Session.ts";
import Member from "../structures/Member.ts";
import Message from "../structures/Message.ts";
import User from "../structures/User.ts";
import Interaction from "../structures/Interaction.ts";

export type RawHandler<T> = (...args: [Session, number, T]) => void;
export type Handler<T extends unknown[]> = (...args: T) => unknown;

export const READY: RawHandler<DiscordReady> = (session, shardId, payload) => {
    session.emit("ready", { ...payload, user: new User(session, payload.user) }, shardId);
};

export const MESSAGE_CREATE: RawHandler<DiscordMessage> = (session, _shardId, message) => {
    session.emit("messageCreate", new Message(session, message));
};

export const MESSAGE_UPDATE: RawHandler<DiscordMessage> = (session, _shardId, new_message) => {
    session.emit("messageUpdate", new Message(session, new_message));
};

export const MESSAGE_DELETE: RawHandler<DiscordMessageDelete> = (session, _shardId, { id, channel_id, guild_id }) => {
    session.emit("messageDelete", { id, channelId: channel_id, guildId: guild_id });
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

export const INTERACTION_CREATE: RawHandler<DiscordInteraction> = (session, _shardId, interaction) => {
    session.unrepliedInteractions.add(BigInt(interaction.id));
    session.emit("interactionCreate", new Interaction(session, interaction));
};

export const raw: RawHandler<unknown> = (session, shardId, data) => {
    session.emit("raw", data, shardId);
};

export interface Ready extends Omit<DiscordReady, "user"> {
    user: User;
}

// deno-fmt-ignore-file
export interface Events {
    "ready":             Handler<[Ready, number]>;
    "messageCreate":     Handler<[Message]>;
    "messageUpdate":     Handler<[Message]>;
    "messageDelete":     Handler<[{ id: Snowflake, channelId: Snowflake, guildId?: Snowflake }]>;
    "guildMemberAdd":    Handler<[Member]>;
    "guildMemberUpdate": Handler<[Member]>;
    "guildMemberRemove": Handler<[User, Snowflake]>;
    "interactionCreate": Handler<[Interaction]>;
    "raw":               Handler<[unknown, number]>;
}
