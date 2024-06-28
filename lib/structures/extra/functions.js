"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.snowflakeToTimestamp = snowflakeToTimestamp;
exports.channelLink = channelLink;
exports.messageLink = messageLink;
exports.resolvePartialEmoji = resolvePartialEmoji;
exports.resolveEmoji = resolveEmoji;
exports.encodeEmoji = encodeEmoji;
exports.hasProps = hasProps;
const globals_1 = require("discord-api-types/globals");
const common_1 = require("../../common");
/** * Convert a timestamp to a snowflake. * @param timestamp The timestamp to convert. * @returns The snowflake. */
function snowflakeToTimestamp(id) {
    return (BigInt(id) >> 22n) + common_1.DiscordEpoch;
}
function channelLink(channelId, guildId) {
    return `https://discord.com/channels/${guildId ?? '@me'}/${channelId}`;
}
function messageLink(channelId, messageId, guildId) {
    return `${channelLink(channelId, guildId)}/${messageId}`;
}
function resolvePartialEmoji(emoji) {
    if (typeof emoji === 'string') {
        const groups = emoji.match(globals_1.FormattingPatterns.Emoji)?.groups;
        if (groups) {
            return { animated: !!groups.animated, name: groups.name, id: groups.id };
        }
        if (emoji.includes('%')) {
            emoji = encodeURIComponent(emoji);
        }
        if (!(emoji.includes(':') || emoji.match(/\d{17,20}/g))) {
            return { name: emoji, id: null };
        }
        return;
    }
    if (!(emoji.id && emoji.name))
        return;
    return { id: emoji.id, name: emoji.name, animated: !!emoji.animated };
}
async function resolveEmoji(emoji, cache) {
    const partial = resolvePartialEmoji(emoji);
    if (partial)
        return partial;
    if (typeof emoji === 'string') {
        if (!emoji.match(/\d{17,20}/g))
            return;
        const fromCache = await cache.emojis?.get(emoji);
        return fromCache && { animated: fromCache.animated, id: fromCache.id, name: fromCache.name };
    }
    const fromCache = await cache.emojis?.get(emoji.id);
    if (fromCache)
        return { animated: fromCache.animated, id: fromCache.id, name: fromCache.name };
    return;
}
function encodeEmoji(rawEmoji) {
    return rawEmoji.id ? `${rawEmoji.name}:${rawEmoji.id}` : `${rawEmoji.name}`;
}
function hasProps(target, props) {
    if (Array.isArray(props)) {
        return props.every(x => hasProps(target, x));
    }
    if (!(props in target)) {
        return false;
    }
    if (typeof target[props] === 'string' && !target[props].length) {
        return false;
    }
    return true;
}
