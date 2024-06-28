"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Formatter = exports.TimestampStyle = exports.HeadingLevel = void 0;
/**
 * Represents heading levels.
 */
var HeadingLevel;
(function (HeadingLevel) {
    /**
     * Represents a level 1 heading. (#)
     */
    HeadingLevel[HeadingLevel["H1"] = 1] = "H1";
    /**
     * Represents a level 2 heading. (##)
     */
    HeadingLevel[HeadingLevel["H2"] = 2] = "H2";
    /**
     * Represents a level 3 heading. (###)
     */
    HeadingLevel[HeadingLevel["H3"] = 3] = "H3";
})(HeadingLevel || (exports.HeadingLevel = HeadingLevel = {}));
/**
 * Represents timestamp styles.
 */
var TimestampStyle;
(function (TimestampStyle) {
    /**
     * Represents a short timestamp style.
     */
    TimestampStyle["ShortTime"] = "t";
    /**
     * Represents a long timestamp style.
     */
    TimestampStyle["LongTime"] = "T";
    /**
     * Represents a short date style.
     */
    TimestampStyle["ShortDate"] = "d";
    /**
     * Represents a long date style.
     */
    TimestampStyle["LongDate"] = "D";
    /**
     * Represents a short time style.
     */
    TimestampStyle["ShortDateTime"] = "f";
    /**
     * Represents a long time style.
     */
    TimestampStyle["LongDateTime"] = "F";
    /**
     * Represents a relative time style.
     */
    TimestampStyle["RelativeTime"] = "R";
})(TimestampStyle || (exports.TimestampStyle = TimestampStyle = {}));
/**
 * Represents a formatter utility for formatting content.
 */
class Formatter {
    /**
     * Formats a code block.
     * @param content The content of the code block.
     * @param language The language of the code block. Defaults to 'txt'.
     * @returns The formatted code block.
     */
    static codeBlock(content, language = 'txt') {
        return `\`\`\`${language}\n${content}\n\`\`\``;
    }
    /**
     * Formats content into inline code.
     * @param content The content to format.
     * @returns The formatted content.
     */
    static inlineCode(content) {
        return `\`${content}\``;
    }
    /**
     * Formats content into bold text.
     * @param content The content to format.
     * @returns The formatted content.
     */
    static bold(content) {
        return `**${content}**`;
    }
    /**
     * Formats content into italic text.
     * @param content The content to format.
     * @returns The formatted content.
     */
    static italic(content) {
        return `*${content}*`;
    }
    /**
     * Formats content into underlined text.
     * @param content The content to format.
     * @returns The formatted content.
     */
    static underline(content) {
        return `__${content}__`;
    }
    /**
     * Formats content into strikethrough text.
     * @param content The content to format.
     * @returns The formatted content.
     */
    static strikeThrough(content) {
        return `~~${content}~~`;
    }
    /**
     * Formats content into a hyperlink.
     * @param content The content to format.
     * @param url The URL to hyperlink to.
     * @returns The formatted content.
     */
    static hyperlink(content, url) {
        return `[${content}](${url})`;
    }
    /**
     * Formats content into a spoiler.
     * @param content The content to format.
     * @returns The formatted content.
     */
    static spoiler(content) {
        return `||${content}||`;
    }
    /**
     * Formats content into a quote.
     * @param content The content to format.
     * @returns The formatted content.
     */
    static blockQuote(content) {
        return `>>> ${content}`;
    }
    /**
     * Formats content into a quote.
     * @param content The content to format.
     * @returns The formatted content.
     */
    static quote(content) {
        return `> ${content}`;
    }
    /**
     * Formats a message link.
     * @param guildId The ID of the guild.
     * @param channelId The ID of the channel.
     * @param messageId The ID of the message.
     * @returns The formatted message link.
     */
    static messageLink(guildId, channelId, messageId) {
        return `https://discord.com/channels/${guildId}/${channelId}/${messageId}`;
    }
    /**
     * Formats a header.
     * @param content The content of the header.
     * @param level The level of the header. Defaults to 1.
     * @returns The formatted header.
     */
    static header(content, level = HeadingLevel.H1) {
        return `${'#'.repeat(level)} ${content}`;
    }
    /**
     * Formats a list.
     * @param items The items of the list.
     * @param ordered Whether the list is ordered. Defaults to false.
     * @returns The formatted list.
     */
    static list(items, ordered = false) {
        return items
            .map((item, index) => {
            return (ordered ? `${index + 1}. ` : '- ') + item;
        })
            .join('\n');
    }
    /**
     * Formats the given timestamp into discord unix timestamp format.
     * @param timestamp The timestamp to format.
     * @param style The style of the timestamp. Defaults to 't'.
     * @returns The formatted timestamp.
     */
    static timestamp(timestamp, style = TimestampStyle.RelativeTime) {
        return `<t:${Math.floor(timestamp.getTime() / 1000)}:${style}>`;
    }
    /**
     * Formats a user mention.
     * @param userId The ID of the user to mention.
     * @returns The formatted user mention.
     */
    static userMention(userId) {
        return `<@${userId}>`;
    }
    /**
     * Formats a role mention.
     * @param roleId The ID of the role to mention.
     * @returns The formatted role mention.
     */
    static roleMention(roleId) {
        return `<@&${roleId}>`;
    }
    /**
     * Formats a channel mention.
     * @param channelId The ID of the channel to mention.
     * @returns The formatted channel mention.
     */
    static channelMention(channelId) {
        return `<#${channelId}>`;
    }
    /**
     * Formats an emoji.
     * @param emojiId The ID of the emoji.
     * @param animated Whether the emoji is animated. Defaults to false.
     * @returns The formatted emoji.
     */
    static emojiMention(emojiId, name, animated = false) {
        return `<${animated ? 'a' : ''}:${name ?? '_'}:${emojiId}>`;
    }
}
exports.Formatter = Formatter;
