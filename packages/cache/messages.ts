import type {
    DiscordEmoji,
    DiscordMessage,
    DiscordMemberWithUser,
    DiscordMessageReactionAdd,
    DiscordMessageReactionRemove,
    DiscordMessageReactionRemoveAll,
    Snowflake
} from "./deps.ts";
import type { CachedUser } from "./users.ts";
import type { SessionCache } from "./mod.ts";
import { Emoji, GuildEmoji, Message, MessageReaction } from "./deps.ts";
import { memberBootstrapper } from "./members.ts";

export interface CachedMessage extends Omit<Message, "author"> {
    authorId: Snowflake;
    author?: CachedUser;
}

export function messageBootstrapper(cache: SessionCache, message: DiscordMessage, partial: boolean) {
    if (message.member) {
        const member: DiscordMemberWithUser = Object.assign(message.member, { user: message.author });

        memberBootstrapper(cache, member, message.guild_id!);
    }

    if (cache.dms.has(message.channel_id)) {
        // is dm
        cache.dms.retrieve(message.channel_id, (dm) => {
            dm.messages[partial ? "updateFields" : "set"](
                message.id,
                Object.assign(
                    new Message(cache.session, message),
                    {
                        authorId: message.author.id,
                        get author(): CachedUser | undefined {
                            return cache.users.get(this.authorId);
                        },
                    },
                ),
            );
        });
    } else {
        // is not dm
        cache.guilds.retrieve(message.guild_id!, (guild) =>
            guild.channels.retrieve(message.channel_id, (dm) => {
                dm.messages[partial ? "updateFields" : "set"](
                    message.id,
                    Object.assign(
                        new Message(cache.session, message),
                        {
                            authorId: message.author.id,
                            get author(): CachedUser | undefined {
                                return cache.users.get(this.authorId);
                            },
                        },
                    ),
                );
            }));
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

export function reactionBootstrapperDeletions(cache: SessionCache, payload: DiscordMessageReactionRemoveAll) {
    if (payload.guild_id) {
        cache.guilds.retrieve(payload.guild_id, (guild) => {
            guild.channels.retrieve(payload.channel_id, (channel) => {
                channel.messages.retrieve(payload.message_id, (message: CachedMessage) => {
                    message.reactions = [];
                });
            });
        });
    } else {
        cache.dms.retrieve(payload.channel_id, (channel) => {
            channel.messages.retrieve(payload.message_id, (message) => {
                message.reactions = [];
            });
        });
    }
}

export function emojiBootstrapper(cache: SessionCache, emoji: DiscordEmoji, guildId: Snowflake) {
    if (!emoji.id) return;
    cache.emojis.set(emoji.id, new GuildEmoji(cache.session, emoji, guildId));
}
