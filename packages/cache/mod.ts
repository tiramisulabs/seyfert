import type {
    SymCache,
    Session,
    Snowflake,
    DiscordGuild,
    DiscordEmoji,
    DiscordUser,
    DiscordChannel,
} from "./deps.ts";

import {
    Guild,
    User,
    DMChannel,
    GuildEmoji,
} from "./deps.ts";

export const cache_sym = Symbol("@cache");

export interface SessionCache extends SymCache {
    guilds: StructCache<Guild>;
    users: StructCache<User>;
    dms: StructCache<DMChannel>;
    emojis: StructCache<GuildEmoji>;
    session: Session,
}

export default function (session: Session): SessionCache {
    return {
        guilds: new StructCache<Guild>(session),
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
    // TODO: optimizee this garbage
    cache.guilds.set(guild.id, new Guild(cache.session, guild));
}
