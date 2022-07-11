import type {
    ChannelTypes,
    DiscordChannel,
    DiscordEmoji,
    DiscordGuild,
    DiscordMemberWithUser,
    DiscordUser,
    Session,
    Snowflake,
    SymCache,
} from "./deps.ts";

import {
    ChannelFactory,
    DMChannel,
    Guild,
    GuildEmoji,
    GuildTextChannel,
    Member,
    Message,
    NewsChannel,
    ThreadChannel,
    User,
    VoiceChannel,
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
    type: ChannelTypes;
    messages: Map<Snowflake, CachedMessage>;
}

export interface SessionCache extends SymCache {
    guilds: StructCache<CachedGuild>;
    users: StructCache<User>;
    dms: StructCache<DMChannel>;
    emojis: StructCache<GuildEmoji>;
    session: Session;
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

export class StructCache<V> extends Map<Snowflake, V> {
    constructor(session: Session, entries?: Iterable<readonly [Snowflake, V]>) {
        super(entries);
        this.session = session;
    }
    readonly session: Session;

    get(key: Snowflake): V | undefined {
        return super.get(key);
    }

    set(key: Snowflake, value: V): this {
        return super.set(key, value);
    }

    has(key: Snowflake): boolean {
        return super.has(key);
    }

    clear(): void {
        return super.clear();
    }

    random(): V | undefined;
    random(amount: number): V[];
    random(amount?: number): V | V[] | undefined {
        const arr = [...this.values()];
        if (typeof amount === "undefined") return arr[Math.floor(Math.random() * arr.length)];
        if (!arr.length) return [];
        if (amount && amount > arr.length) amount = arr.length;
        return Array.from(
            { length: Math.min(amount, arr.length) },
            (): V => arr.splice(Math.floor(Math.random() * arr.length), 1)[0],
        );
    }

    find(fn: (value: V, key: Snowflake, structCache: this) => boolean): V | undefined {
        for (const [key, value] of this.entries()) {
            if (fn(value, key, this)) return value;
        }
        return undefined;
    }

    filter(fn: (value: V, key: Snowflake, structCache: this) => boolean): StructCache<V> {
        const result = new StructCache<V>(this.session);
        for (const [key, value] of this.entries()) {
            if (fn(value, key, this)) result.set(key, value);
        }
        return result;
    }

    forEach<T>(fn: (value: V, key: Snowflake, structCache: this) => T): void {
        super.forEach((v: V, k: Snowflake) => {
            fn(v, k, this);
        });
    }

    clone(): StructCache<V> {
        return new StructCache(this.session, this.entries());
    }

    concat(structures: StructCache<V>[]): StructCache<V> {
        const conc = this.clone();

        for (const structure of structures) {
            if (!structure || !(structure instanceof StructCache)) continue;
            for (const [key, value] of structure.entries()) {
                conc.set(key, value);
            }
        }
        return conc;
    }

    some(fn: (value: V, key: Snowflake, structCache: this) => boolean): boolean {
        for (const [key, value] of this.entries()) {
            if (fn(value, key, this)) {
                return true;
            }
        }
        return false;
    }

    every(fn: (value: V, key: Snowflake, structCache: this) => boolean): boolean {
        for (const [key, value] of this.entries()) {
            if (!fn(value, key, this)) {
                return false;
            }
        }
        return true;
    }

    first(): V | undefined;
    first(amount: number): V[];
    first(amount?: number): V | V[] | undefined {
        if (!amount || amount <= 1) {
            return this.values().next().value;
        }
        const values = [...this.values()];
        amount = Math.min(values.length, amount);
        return values.slice(0, amount);
    }

    last(): V | undefined;
    last(amount: number): V[];
    last(amount?: number): V | V[] | undefined {
        const values = [...this.values()];
        if (!amount || amount <= 1) {
            return values[values.length - 1];
        }
        amount = Math.min(values.length, amount);
        return values.slice(-amount);
    }

    reverse(): this {
        const entries = [...this.entries()].reverse();
        this.clear();
        for (const [key, value] of entries) this.set(key, value);
        return this;
    }

    map<T>(fn: (value: V, key: Snowflake, collection: this) => T): T[] {
        const result: T[] = [];
        for (const [key, value] of this.entries()) {
            result.push(fn(value, key, this));
        }
        return result;
    }

    reduce<T>(fn: (acc: T, value: V, key: Snowflake, structCache: this) => T, initV?: T): T {
        const entries = this.entries();
        const first = entries.next().value;
        let result = initV;
        if (result !== undefined) {
            result = fn(result, first[1], first[0], this);
        } else {
            result = first;
        }
        for (const [key, value] of entries) {
            result = fn(result!, value, key, this);
        }
        return result!;
    }

    get size(): number {
        return super.size;
    }

    get empty(): boolean {
        return this.size === 0;
    }
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
            },
        });

        return [data.user!.id, obj as CachedMember];
    }));

    const channels = new Map(guild.channels?.map((data) => {
        const obj = Object.assign(ChannelFactory.from(cache.session, data), {
            messages: new Map(),
        });

        return [data.id, obj as CachedGuildChannel];
    }));

    cache.guilds.set(
        guild.id,
        Object.assign(
            new Guild(cache.session, guild),
            { members, channels },
        ),
    );
}
