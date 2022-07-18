// deno-lint-ignore-file no-empty-interface
import type { Session } from '../Session.ts';
import type { DiscordMemberWithUser, DiscordMessageReactionAdd, DiscordReaction } from '../../discordeno/mod.ts';
import Emoji from './Emoji.ts';
import Member from './Member.ts';

export interface MessageReactionAdd {
    userId: string;
    channelId: string;
    messageId: string;
    guildId?: string;
    member?: Member;
    emoji: Partial<Emoji>;
}

export interface MessageReactionRemove extends Omit<MessageReactionAdd, 'member'> {}

export interface MessageReactionRemoveAll extends Pick<MessageReactionAdd, 'channelId' | 'messageId' | 'guildId'> {}

export type MessageReactionRemoveEmoji = Pick<
    MessageReactionAdd,
    'channelId' | 'guildId' | 'messageId' | 'emoji'
>;

export function NewMessageReactionAdd(session: Session, data: DiscordMessageReactionAdd): MessageReactionAdd {
    return {
        userId: data.user_id,
        channelId: data.channel_id,
        messageId: data.message_id,
        guildId: data.guild_id,
        member: data.member
            ? new Member(session, data.member as DiscordMemberWithUser, data.guild_id || '')
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
