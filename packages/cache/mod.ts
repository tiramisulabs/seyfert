import type {
    ChannelTypes,
    SymCache,
    Session,
    Snowflake,
    DiscordGuild,
    DiscordEmoji,
    DiscordUser,
    DiscordChannel,
    DiscordMemberWithUser,
} from "./deps.ts";

import {
    ChannelFactory,
    Guild,
    User,
    DMChannel,
    GuildEmoji,
    GuildTextChannel,
    Member,
    Message,
    VoiceChannel,
    ThreadChannel,
    NewsChannel,
} from "./deps.ts";

export const cache_sym = Symbol("@cache");

export interface CachedMessage extends Omit<Message, "author"> {
    authorId: Snowflake;
    author?: User;
}

export interface CachedMember extends Omit<Member, "user"> {
    userId: Snowflake;
    user?: User;
}

export interface CachedGuild extends Omit<Guild, "members" | "channels"> {
    channels: Map<Snowflake, CachedGuildChannel>;
    members: Map<Snowflake, CachedMember>;
}

export interface CachedGuildChannel extends Omit<GuildTextChannel, "type"> {
    type: ChannelTypes;
    messages: Map<Snowflake, CachedMessage>;
}

export interface CachedGuildChannel extends Omit<VoiceChannel, "type"> {
    type: ChannelTypes;
    messages: Map<Snowflake, CachedMessage>;
}

export interface CachedGuildChannel extends Omit<NewsChannel, "type"> {
    type: ChannelTypes;
    messages: Map<Snowflake, CachedMessage>;
}

export interface CachedGuildChannel extends Omit<ThreadChannel, "type"> {
    type: ChannelTypes
    messages: Map<Snowflake, CachedMessage>;
}

export interface SessionCache extends SymCache {
    guilds: StructCache<CachedGuild>;
    users: StructCache<User>;
    dms: StructCache<DMChannel>;
    emojis: StructCache<GuildEmoji>;
    session: Session,
}

export default function (session: Session): SessionCache {
    return {
        guilds: new StructCache<CachedGuild>(session),
        users: new StructCache<User>(session),
        dms: new StructCache<DMChannel>(session),
        emojis: new StructCache<GuildEmoji>(session),
        cache: cache_sym,
        session,
    };
}

export class StructCache<T> extends Map<Snowflake, T> {
    constructor(session: Session, entries?: Iterable<readonly [Snowflake, T]>) {
        super(entries);
        this.session = session;
    }

    readonly session: Session;
}

export function userBootstrapper(cache: SessionCache, user: DiscordUser) {
    cache.users.set(user.id, new User(cache.session, user));
}

export function emojiBootstrapper(cache: SessionCache, emoji: DiscordEmoji, guildId: Snowflake) {
    if (!emoji.id) return;
    cache.emojis.set(emoji.id, new GuildEmoji(cache.session, emoji, guildId));
}

export function DMChannelBootstrapper(cache: SessionCache, channel: DiscordChannel) {
    cache.dms.set(channel.id, new DMChannel(cache.session, channel));
}

export function guildBootstrapper(guild: DiscordGuild, cache: SessionCache) {
    const members = new Map(guild.members?.map((data) => {
        const obj: CachedMember = Object.assign(new Member(cache.session, data as DiscordMemberWithUser, guild.id), {
            userId: data.user!.id,
            get user(): User | undefined {
                return cache.users.get(this.userId);
            }
        });

        return [data.user!.id, obj as CachedMember];
    }));

    const channels = new Map(guild.channels?.map((data) => {
        const obj = Object.assign(ChannelFactory.from(cache.session, data), {
            messages: new Map(),
        });

        return [data.id, obj as CachedGuildChannel];
    }));

    cache.guilds.set(guild.id, Object.assign(
        new Guild(cache.session, guild),
        { members, channels },
    ));
}
