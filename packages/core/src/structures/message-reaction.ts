/* eslint-disable no-mixed-spaces-and-tabs */
import type { Session } from '../biscuit';
import type {
	DiscordMemberWithUser,
	DiscordMessageReactionAdd,
	DiscordReaction,
} from '@biscuitland/api-types';
import { Emoji } from './emojis';
import { Member } from './members';

/**
 * Represents when a new reaction was added to a message.
 * @link https://discord.com/developers/docs/topics/gateway#message-reaction-add
 */
export interface MessageReactionAdd {
	userId: string;
	channelId: string;
	messageId: string;
	guildId?: string;
	member?: Member;
	emoji: Partial<Emoji>;
}

/**
 * Represents when a reaction was removed from a message.
 * Equal to MessageReactionAdd but without 'member' property.
 * @see {@link MessageReactionAdd}
 * @link https://discord.com/developers/docs/topics/gateway#message-reaction-remove-message-reaction-remove-event-fields
 */
export type MessageReactionRemove = Omit<MessageReactionAdd, 'member'>;

/**
 * Represents when all reactions were removed from a message.
 * Equals to MessageReactionAdd but with 'channelId', 'messageId' and 'guildId' properties guaranteed.
 * @see {@link MessageReactionAdd}
 * @link https://discord.com/developers/docs/topics/gateway#message-reaction-remove-all
 */
export type MessageReactionRemoveAll = Pick<
	MessageReactionAdd,
	'channelId' | 'messageId' | 'guildId'
>;

/**
 * Represents when a reaction-emoji was removed from a message.
 * Equals to MessageReactionAdd but with 'channelId', 'messageId', 'emoji' and 'guildId' properties guaranteed.
 * @see {@link MessageReactionRemove}
 * @see {@link Emoji}
 * @link https://discord.com/developers/docs/topics/gateway#message-reaction-remove-emoji
 */
export type MessageReactionRemoveEmoji = Pick<
	MessageReactionAdd,
	'channelId' | 'guildId' | 'messageId' | 'emoji'
>;

/**
 * Creates a new MessageReactionAdd object.
 * @param session - Current application session.
 * @param data - Discord message reaction to parse.
 */
export function NewMessageReactionAdd(
	session: Session,
	data: DiscordMessageReactionAdd
): MessageReactionAdd {
	return {
		userId: data.user_id,
		channelId: data.channel_id,
		messageId: data.message_id,
		guildId: data.guild_id,
		member: data.member
			? new Member(
					session,
					data.member as DiscordMemberWithUser,
					data.guild_id ?? ''
			  )
			: undefined,
		emoji: new Emoji(session, data.emoji),
	};
}

/**
 * Represents a reaction
 * @link https://discord.com/developers/docs/resources/channel#reaction-object
 */
export class MessageReaction {
	constructor(session: Session, data: DiscordReaction) {
		this.session = session;
		this.me = data.me;
		this.count = data.count;
		this.emoji = new Emoji(session, data.emoji);
	}

	readonly session: Session;
	me: boolean;
	count: number;
	emoji: Emoji;
}

export default MessageReaction;
