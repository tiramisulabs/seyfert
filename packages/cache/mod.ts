import type {
    ChannelTypes,
    DiscordMessage,
    DiscordChannel,
    DiscordEmoji,
    DiscordGuild,
    DiscordMemberWithUser,
    DiscordMessageReactionAdd,
    DiscordMessageReactionRemove,
    DiscordMessageReactionRemoveEmoji,
    DiscordMessageReactionRemoveAll,
    DiscordUser,
    Session,
    Snowflake,
    SymCache,
} from "./deps.ts";

import {
    ChannelFactory,
    DMChannel,
    Emoji,
    Guild,
    GuildEmoji,
    GuildTextChannel,
    Member,
    Message,
    MessageReaction,
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
    channels: StructCache<CachedGuildChannel>;
    members: StructCache<CachedMember>;
}

export interface CachedGuildChannel extends Omit<GuildTextChannel, "type"> {
    type: ChannelTypes;
    messages: StructCache<CachedMessage>;
}

export interface CachedGuildChannel extends Omit<VoiceChannel, "type"> {
    type: ChannelTypes;
    messages: StructCache<CachedMessage>;
}

export interface CachedGuildChannel extends Omit<NewsChannel, "type"> {
    type: ChannelTypes;
    messages: StructCache<CachedMessage>;
}

export interface CachedGuildChannel extends Omit<ThreadChannel, "type"> {
    type: ChannelTypes;
    messages: StructCache<CachedMessage>;
}

export interface CachedDMChannel extends DMChannel {
    messages: StructCache<CachedMessage>;
}

export interface SessionCache extends SymCache {
    guilds: StructCache<CachedGuild>;
    users: StructCache<User>;
    dms: StructCache<CachedDMChannel>;
    emojis: StructCache<Emoji>;
    session: Session;
}

export default function (session: Session): SessionCache {
    const cache = {
        guilds: new StructCache<CachedGuild>(session),
        users: new StructCache<User>(session),
        dms: new StructCache<CachedDMChannel>(session),
        emojis: new StructCache<Emoji>(session),
        cache: cache_sym,
        session,
    };

    session.on("raw", (data) => {
        // deno-lint-ignore no-explicit-any
        const raw = data.d as any;

        switch (data.t) {
            case "MESSAGE_CREATE":
                messageBootstrapper(cache, raw, false);
            break;
            case "MESSAGE_UPDATE":
                messageBootstrapper(cache, raw, !raw.edited_timestamp);
            break;
            case "CHANNEL_CREATE":
                // DMChannelBootstrapper(cache, raw);
            break;
            case "GUILD_MEMBER_ADD":
                memberBootstrapper(cache, raw, raw.guild_id);
            break;
            case "GUILD_CREATE":
                guildBootstrapper(cache, raw);
            break;
            case "GUILD_DELETE":
                cache.guilds.delete(raw.id);
            break;
            case "MESSAGE_DELETE":
                // pass
            break;
            case "MESSAGE_REACTION_ADD":
                reactionBootstrapper(cache, raw, false);
            break;
            case "MESSAGE_REACTION_REMOVE":
                reactionBootstrapper(cache, raw, false);
            break;
            case "MESSAGE_REACTION_REMOVE_ALL":
                reactionBootstrapperDeletions(cache, raw);
            break;
        }
    });

    return cache;
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

    updateFields(key: Snowflake, obj: Partial<V>) {
        const value = this.get(key);

        if (!value) {
            return;
        }

        for (const prop in obj) {
            if (obj[prop]) {
                value[prop] = obj[prop]!;
            }
        }

        return this.set(key, value);
    }

    getOr(key: Snowflake, or: V): V | undefined {
        return this.get(key) ?? or;
    }

    retrieve<T>(key: Snowflake, fn: (value: V) => T) {
        const value = this.get(key);

        if (!value) {
            return;
        }

        return fn(value);
    }
}

export function reactionBootstrapperDeletions(cache: SessionCache, payload: DiscordMessageReactionRemoveAll) {
    if (payload.guild_id) {
        cache.guilds.retrieve(payload.guild_id, (guild) => {
            guild.channels.retrieve(payload.channel_id, (channel) => {
                channel.messages.retrieve(payload.message_id, (message) => {
                    message.reactions = [];
                });
            });
        });
    }
    else {
        cache.dms.retrieve(payload.channel_id, (channel) => {
            channel.messages.retrieve(payload.message_id, (message) => {
                message.reactions = [];
            });
        });
    }
}

export function reactionBootstrapper(
    cache: SessionCache,
    reaction: DiscordMessageReactionAdd | DiscordMessageReactionRemove,
    remove: boolean,
) {
    cache.emojis.set(reaction.emoji.id ?? reaction.emoji.name!, new Emoji(cache.session, reaction.emoji));

    function onAdd(message: CachedMessage) {
        const reactions = message.reactions.map((r) => r.emoji.name);

        const upsertData = {
            count: 1,
            emoji: reaction.emoji,
            me: reaction.user_id === cache.session.botId,
        };

        if (reactions.length === 0) {
            message.reactions = [];
        } else if (!reactions.includes(reaction.emoji.name)) {
            message.reactions.push(new MessageReaction(cache.session, upsertData));
        } else {
            const current = message.reactions?.[reactions.indexOf(reaction.emoji.name)];

            if (current && message.reactions?.[message.reactions.indexOf(current)]) {
                // add 1 to reaction count
                ++message.reactions[message.reactions.indexOf(current)].count;
            }
        }
    }

    function onRemove(message: CachedMessage) {
        const reactions = message.reactions.map((r) => r.emoji.name);

        if (reactions.indexOf(reaction.emoji.name) !== undefined) {
            const current = message.reactions[reactions.indexOf(reaction.emoji.name)];

            if (current) {
                if (current.count > 0) {
                    current.count--;
                }
                if (current.count === 0) {
                    message.reactions.splice(reactions?.indexOf(reaction.emoji.name), 1);
                }
            }
        }
    }

    if (reaction.guild_id) {
        cache.guilds.retrieve(reaction.guild_id, (guild) => {
            guild.channels.retrieve(reaction.channel_id, (channel) => {
                channel.messages.retrieve(reaction.message_id, (message) => {
                    if (remove) onRemove(message);
                    else onAdd(message);
                });
            });
        });
    } else {
        cache.dms.retrieve(reaction.channel_id, (channel) => {
            channel.messages.retrieve(reaction.message_id, (message) => {
                if (remove) onRemove(message);
                else onAdd(message);
            });
        });
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
    cache.dms.set(channel.id, Object.assign(
        new DMChannel(cache.session, channel),
        { messages: new StructCache<CachedMessage>(cache.session) }
    ));
}

export function memberBootstrapper(cache: SessionCache, member: DiscordMemberWithUser, guildId: Snowflake) {
    cache.guilds.retrieve(guildId, (guild) => {
        guild.members.set(member.user.id, Object.assign(
            new Member(cache.session, member, guildId),
            {
                userId: member.user.id,
                get user(): User | undefined {
                    return cache.users.get(this.userId);
                }
            }
        ));
    });
}

export function messageBootstrapper(cache: SessionCache, message: DiscordMessage, partial: boolean) {
    if (message.member) {
        const member: DiscordMemberWithUser = Object.assign(message.member, { user: message.author });

        memberBootstrapper(cache, member, message.guild_id!);
    }

    if (cache.dms.has(message.channel_id)) {
        // is dm
        cache.dms.retrieve(message.channel_id, (dm) => {
            dm.messages[partial ? "updateFields" : "set"](message.id, Object.assign(
                new Message(cache.session, message),
                {
                    authorId: message.author.id,
                    get author(): User | undefined {
                        return cache.users.get(this.authorId);
                    },
                }
            ));
        });
    } else {
        // is not dm
        cache.guilds.retrieve(message.guild_id!, (guild) => guild.channels.retrieve(message.channel_id, (dm) => {
            dm.messages[partial ? "updateFields" : "set"](message.id, Object.assign(
                new Message(cache.session, message),
                {
                    authorId: message.author.id,
                    get author(): User | undefined {
                        return cache.users.get(this.authorId);
                    },
                }
            ));
        }));
    }
}

export function guildBootstrapper(cache: SessionCache, guild: DiscordGuild) {
    const members = new StructCache(cache.session, guild.members?.map((data) => {
        const obj: CachedMember = Object.assign(new Member(cache.session, data as DiscordMemberWithUser, guild.id), {
            userId: data.user!.id,
            get user(): User | undefined {
                return cache.users.get(this.userId);
            },
        });

        return [data.user!.id, obj as CachedMember];
    }));

    const channels = new StructCache(cache.session, guild.channels?.map((data) => {
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
