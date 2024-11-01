import type { BitFieldResolvable } from '../../structures/extra/BitField';
import { PermissionsBitField } from '../../structures/extra/Permissions';
import type { OAuth2Scopes, PermissionFlagsBits } from '../../types';

/**
 * Represents options for creating a OAuth2 uri
 */
export type OAuth2URLOptions = {
	/**
	 * Oauth2 scopes to be used.
	 */
	scopes: OAuth2Scopes[];
	/**
	 * Permissions to be granted to the application.
	 */
	permissions: BitFieldResolvable<typeof PermissionFlagsBits>;
	/**
	 * Whether guild select must be disabled in oauth2 interface.
	 */
	disableGuildSelect?: boolean;
};

/**
 * Represents heading levels.
 */
export enum HeadingLevel {
	/**
	 * Represents a level 1 heading. (#)
	 */
	H1 = 1,
	/**
	 * Represents a level 2 heading. (##)
	 */
	H2 = 2,
	/**
	 * Represents a level 3 heading. (###)
	 */
	H3 = 3,
}

/**
 * Represents timestamp styles.
 */
export enum TimestampStyle {
	/**
	 * Represents a short timestamp style.
	 */
	ShortTime = 't',
	/**
	 * Represents a long timestamp style.
	 */
	LongTime = 'T',
	/**
	 * Represents a short date style.
	 */
	ShortDate = 'd',
	/**
	 * Represents a long date style.
	 */
	LongDate = 'D',
	/**
	 * Represents a short time style.
	 */
	ShortDateTime = 'f',
	/**
	 * Represents a long time style.
	 */
	LongDateTime = 'F',
	/**
	 * Represents a relative time style.
	 */
	RelativeTime = 'R',
}

/**
 * Represents a message link.
 */
type MessageLink = `https://discord.com/channels/${string}/${string}/${string}`;

/**
 * Represents a timestamp.
 */
type Timestamp = `<t:${number}:${TimestampStyle}>`;

/**
 * Represents a formatter utility for formatting content.
 */
export const Formatter = {
	/**
	 * Formats a code block.
	 * @param content The content of the code block.
	 * @param language The language of the code block. Defaults to 'txt'.
	 * @returns The formatted code block.
	 */
	codeBlock(content: string, language = 'txt'): string {
		return `\`\`\`${language}\n${content}\n\`\`\``;
	},

	/**
	 * Formats content into inline code.
	 * @param content The content to format.
	 * @returns The formatted content.
	 */
	inlineCode(content: string): `\`${string}\`` {
		return `\`${content}\``;
	},

	/**
	 * Formats content into bold text.
	 * @param content The content to format.
	 * @returns The formatted content.
	 */
	bold(content: string): `**${string}**` {
		return `**${content}**`;
	},

	/**
	 * Formats content into italic text.
	 * @param content The content to format.
	 * @returns The formatted content.
	 */
	italic(content: string): `*${string}*` {
		return `*${content}*`;
	},

	/**
	 * Formats content into underlined text.
	 * @param content The content to format.
	 * @returns The formatted content.
	 */
	underline(content: string): `__${string}__` {
		return `__${content}__`;
	},

	/**
	 * Formats content into strikethrough text.
	 * @param content The content to format.
	 * @returns The formatted content.
	 */
	strikeThrough(content: string): `~~${string}~~` {
		return `~~${content}~~`;
	},

	/**
	 * Formats content into a hyperlink.
	 * @param content The content to format.
	 * @param url The URL to hyperlink to.
	 * @returns The formatted content.
	 */
	hyperlink(content: string, url: string): `[${string}](${string})` {
		return `[${content}](${url})`;
	},

	/**
	 * Formats content into a spoiler.
	 * @param content The content to format.
	 * @returns The formatted content.
	 */
	spoiler(content: string): `||${string}||` {
		return `||${content}||`;
	},

	/**
	 * Formats content into a quote.
	 * @param content The content to format.
	 * @returns The formatted content.
	 */
	blockQuote(content: string): string {
		return `>>> ${content}`;
	},

	/**
	 * Formats content into a quote.
	 * @param content The content to format.
	 * @returns The formatted content.
	 */
	quote(content: string): string {
		return `> ${content}`;
	},

	/**
	 * Formats a message link.
	 * @param guildId The ID of the guild.
	 * @param channelId The ID of the channel.
	 * @param messageId The ID of the message.
	 * @returns The formatted message link.
	 */
	messageLink(guildId: string, channelId: string, messageId: string): MessageLink {
		return `https://discord.com/channels/${guildId}/${channelId}/${messageId}`;
	},

	/**
	 * Formats a header.
	 * @param content The content of the header.
	 * @param level The level of the header. Defaults to 1.
	 * @returns The formatted header.
	 */
	header(content: string, level: HeadingLevel = HeadingLevel.H1): string {
		return `${'#'.repeat(level)} ${content}`;
	},

	/**
	 * Formats a list.
	 * @param items The items of the list.
	 * @param ordered Whether the list is ordered. Defaults to false.
	 * @returns The formatted list.
	 */
	list(items: string[], ordered = false): string {
		return items
			.map((item, index) => {
				return (ordered ? `${index + 1}. ` : '- ') + item;
			})
			.join('\n');
	},

	/**
	 * Formats the given timestamp into discord unix timestamp format.
	 * @param timestamp The timestamp to format.
	 * @param style The style of the timestamp. Defaults to 't'.
	 * @returns The formatted timestamp.
	 */
	timestamp(timestamp: Date, style: TimestampStyle = TimestampStyle.RelativeTime): Timestamp {
		return `<t:${Math.floor(timestamp.getTime() / 1000)}:${style}>`;
	},

	/**
	 * Formats a user mention.
	 * @param userId The ID of the user to mention.
	 * @returns The formatted user mention.
	 */
	userMention(userId: string): `<@${string}>` {
		return `<@${userId}>`;
	},

	/**
	 * Formats a role mention.
	 * @param roleId The ID of the role to mention.
	 * @returns The formatted role mention.
	 */
	roleMention(roleId: string): `<@&${string}>` {
		return `<@&${roleId}>`;
	},

	/**
	 * Formats a channel mention.
	 * @param channelId The ID of the channel to mention.
	 * @returns The formatted channel mention.
	 */
	channelMention(channelId: string): `<#${string}>` {
		return `<#${channelId}>`;
	},

	/**
	 * Formats an emoji.
	 * @param emojiId The ID of the emoji.
	 * @param animated Whether the emoji is animated. Defaults to false.
	 * @returns The formatted emoji.
	 */
	emojiMention(emojiId: string, name: string | null, animated = false): string {
		return `<${animated ? 'a' : ''}:${name ?? '_'}:${emojiId}>`;
	},

	/**
	 * Formats a channel link.
	 * @param channelId The ID of the channel.
	 * @param guildId The ID of the guild. Defaults to '@me'.
	 * @returns The formatted channel link.
	 */
	channelLink(channelId: string, guildId?: string) {
		return `https://discord.com/channels/${guildId ?? '@me'}/${channelId}`;
	},

	/**
	 * Forms a oauth2 invite link for the bot.
	 * @param applicationId The ID of the application.
	 * @param options Options for forming the invite link.
	 * @param options.scopes Oauth2 scopes to be used.
	 * @param options.disableGuildSelect Whether or not guild select must be disabled in oauth2 interface.
	 * @param options.permissions Permissions to be granted to the application.
	 */
	generateOAuth2URL(
		applicationId: string,
		{ scopes, permissions, disableGuildSelect = false }: OAuth2URLOptions,
	): string {
		const queryOptions = new URLSearchParams({
			client_id: applicationId,
			scope: scopes.join(' '),
			disable_guild_select: String(disableGuildSelect),
		});

		if (permissions) {
			permissions = PermissionsBitField.resolve(permissions);
			queryOptions.set('permissions', permissions.toString());
		}

		return `https://discord.com/oauth2/authorize?${queryOptions.toString()}`;
	},
};
