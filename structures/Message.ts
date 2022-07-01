import type { Model } from "./Base.ts";
import type { Snowflake } from "../util/Snowflake.ts";
import type { Session } from "../session/Session.ts";
import type { AllowedMentionsTypes, DiscordMessage, FileContent } from "../vendor/external.ts";
import { MessageFlags } from "../util/shared/flags.ts";
import User from "./User.ts";
import Member from "./Member.ts";
import Attachment from "./Attachment.ts";
import * as Routes from "../util/Routes.ts";

/**
 * @link https://discord.com/developers/docs/resources/channel#allowed-mentions-object
 */
export interface AllowedMentions {
    parse?: AllowedMentionsTypes[];
    repliedUser?: boolean;
    roles?: Snowflake[];
    users?: Snowflake[];
}

export interface CreateMessageReference {
    messageId: Snowflake;
    channelId?: Snowflake;
    guildId?: Snowflake;
    failIfNotExists?: boolean;
}

/**
 * @link https://discord.com/developers/docs/resources/channel#create-message-json-params
 */
export interface CreateMessage {
    content?: string;
    allowedMentions?: AllowedMentions;
    files?: FileContent[];
    messageReference?: CreateMessageReference;
}

/**
 * @link https://discord.com/developers/docs/resources/channel#edit-message-json-params
 */
export interface EditMessage extends Partial<CreateMessage> {
    flags?: MessageFlags;
}

/**
 * Represents a message
 * @link https://discord.com/developers/docs/resources/channel#message-object
 */
export class Message implements Model {
    constructor(session: Session, data: DiscordMessage) {
        this.session = session;
        this.id = data.id;

        this.channelId = data.channel_id;
        this.guildId = data.guild_id;

        this.author = new User(session, data.author);
        this.flags = data.flags;
        this.pinned = !!data.pinned;
        this.tts = !!data.tts;
        this.content = data.content!;

        this.attachments = data.attachments.map((attachment) => new Attachment(session, attachment));

        // user is always null on MessageCreate and its replaced with author

        if (data.guild_id && data.member) {
            this.member = new Member(session, { ...data.member, user: data.author }, data.guild_id);
        }
    }

    readonly session: Session;
    readonly id: Snowflake;

    channelId: Snowflake;
    guildId?: Snowflake;
    author: User;
    flags?: MessageFlags;
    pinned: boolean;
    tts: boolean;
    content: string;

    attachments: Attachment[];
    member?: Member;

    get url() {
        return `https://discord.com/channels/${this.guildId ?? "@me"}/${this.channelId}/${this.id}`;
    }

    /** Edits the current message */
    async edit({ content, allowedMentions, flags }: EditMessage): Promise<Message> {
        const message = await this.session.rest.runMethod(
            this.session.rest,
            "POST",
            Routes.CHANNEL_MESSAGE(this.id, this.channelId),
            {
                content,
                allowed_mentions: {
                    parse: allowedMentions?.parse,
                    roles: allowedMentions?.roles,
                    users: allowedMentions?.users,
                    replied_user: allowedMentions?.repliedUser,
                },
                flags,
            },
        );

        return message;
    }

    async suppressEmbeds(suppress: true): Promise<Message>;
    async suppressEmbeds(suppress: false): Promise<Message | undefined>;
    async suppressEmbeds(suppress = true) {
        if (this.flags === MessageFlags.SupressEmbeds && suppress === false) {
            return;
        }

        const message = await this.edit({ flags: MessageFlags.SupressEmbeds });

        return message;
    }

    async delete({ reason }: { reason: string }): Promise<Message> {
        await this.session.rest.runMethod<undefined>(
            this.session.rest,
            "DELETE",
            Routes.CHANNEL_MESSAGE(this.channelId, this.id),
            { reason },
        );

        return this;
    }

    /** Replies directly in the channel the message was sent */
    async reply(options: CreateMessage): Promise<Message> {
        const message = await this.session.rest.runMethod<DiscordMessage>(
            this.session.rest,
            "POST",
            Routes.CHANNEL_MESSAGES(this.channelId),
            {
                content: options.content,
                file: options.files,
                allowed_mentions: {
                    parse: options.allowedMentions?.parse,
                    roles: options.allowedMentions?.roles,
                    users: options.allowedMentions?.users,
                    replied_user: options.allowedMentions?.repliedUser,
                },
                message_reference: options.messageReference
                    ? {
                        message_id: options.messageReference.messageId,
                        channel_id: options.messageReference.channelId,
                        guild_id: options.messageReference.guildId,
                        fail_if_not_exists: options.messageReference.failIfNotExists ?? true,
                    }
                    : undefined,
            },
        );

        return new Message(this.session, message);
    }

    inGuild(): this is { guildId: Snowflake } & Message {
        return !!this.guildId;
    }
}

export default Message;
