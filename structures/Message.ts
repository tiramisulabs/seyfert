import type { Model } from "./Base.ts";
import type { Session } from "../session/Session.ts";
import type {
    AllowedMentionsTypes,
    DiscordEmbed,
    DiscordMessage,
    DiscordUser,
    FileContent,
    MessageActivityTypes,
    MessageTypes,
} from "../vendor/external.ts";
import type { Component } from "./components/Component.ts";
import type { GetReactions } from "../util/Routes.ts";
import { MessageFlags } from "../util/shared/flags.ts";
import { iconHashToBigInt } from "../util/hash.ts";
import { Snowflake } from "../util/Snowflake.ts";
import User from "./User.ts";
import Member from "./Member.ts";
import Attachment from "./Attachment.ts";
import ComponentFactory from "./components/ComponentFactory.ts";
import MessageReaction from "./MessageReaction.ts";
// import ThreadChannel from "./channels/ThreadChannel.ts";
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
    embeds?: DiscordEmbed[];
    content?: string;
    allowedMentions?: AllowedMentions;
    files?: FileContent[];
    messageReference?: CreateMessageReference;
    tts?: boolean;
}

/**
 * @link https://discord.com/developers/docs/resources/channel#edit-message-json-params
 */
export interface EditMessage extends Partial<CreateMessage> {
    flags?: MessageFlags;
}

export type ReactionResolvable = string | {
    name: string;
    id: Snowflake;
};

export interface WebhookAuthor {
    id: string;
    username: string;
    discriminator: string;
    avatar?: bigint;
}

/**
 * Represents a message
 * @link https://discord.com/developers/docs/resources/channel#message-object
 */
export class Message implements Model {
    constructor(session: Session, data: DiscordMessage) {
        this.session = session;
        this.id = data.id;

        this.type = data.type;
        this.channelId = data.channel_id;
        this.guildId = data.guild_id;
        this.applicationId = data.application_id;

        if (!data.webhook_id) {
            this.author = new User(session, data.author);
        }

        this.flags = data.flags;
        this.pinned = !!data.pinned;
        this.tts = !!data.tts;
        this.content = data.content!;
        this.nonce = data.nonce;
        this.mentionEveryone = data.mention_everyone;

        this.timestamp = Date.parse(data.timestamp);
        this.editedTimestamp = data.edited_timestamp ? Date.parse(data.edited_timestamp) : undefined;

        this.reactions = data.reactions?.map((react) => new MessageReaction(session, react)) ?? [];
        this.attachments = data.attachments.map((attachment) => new Attachment(session, attachment));
        this.embeds = data.embeds;

        if (data.thread && data.guild_id) {
            // this.thread = new ThreadChannel(session, data.thread, data.guild_id);
        }

        // webhook handling
        if (data.webhook_id && data.author.discriminator === "0000") {
            this.webhook = {
                id: data.webhook_id!,
                username: data.author.username,
                discriminator: data.author.discriminator,
                avatar: data.author.avatar ? iconHashToBigInt(data.author.avatar) : undefined,
            };
        }

        // user is always null on MessageCreate and its replaced with author
        if (data.guild_id && data.member && !this.isWebhookMessage()) {
            this.member = new Member(session, { ...data.member, user: data.author }, data.guild_id);
        }

        this.components = data.components?.map((component) => ComponentFactory.from(session, component)) ?? [];

        if (data.activity) {
            this.activity = {
                partyId: data.activity.party_id,
                type: data.activity.type,
            };
        }
    }

    readonly session: Session;
    readonly id: Snowflake;

    type: MessageTypes;
    channelId: Snowflake;
    guildId?: Snowflake;
    applicationId?: Snowflake;
    author!: User;
    flags?: MessageFlags;
    pinned: boolean;
    tts: boolean;
    content: string;
    nonce?: string | number;
    mentionEveryone: boolean;

    timestamp: number;
    editedTimestamp?: number;

    reactions: MessageReaction[];
    attachments: Attachment[];
    embeds: DiscordEmbed[];
    member?: Member;
    thread?: ThreadChannel;
    components: Component[];

    webhook?: WebhookAuthor;
    activity?: {
        partyId?: Snowflake;
        type: MessageActivityTypes;
    };

    get createdTimestamp() {
        return Snowflake.snowflakeToTimestamp(this.id);
    }

    get createdAt() {
        return new Date(this.createdTimestamp);
    }

    get sentAt() {
        return new Date(this.timestamp);
    }

    get editedAt() {
        return this.editedTimestamp ? new Date(this.editedTimestamp) : undefined;
    }

    get edited() {
        return this.editedTimestamp;
    }

    get url() {
        return `https://discord.com/channels/${this.guildId ?? "@me"}/${this.channelId}/${this.id}`;
    }

    async pin() {
        await this.session.rest.runMethod<undefined>(
            this.session.rest,
            "PUT",
            Routes.CHANNEL_PIN(this.channelId, this.id),
        );
    }

    async unpin() {
        await this.session.rest.runMethod<undefined>(
            this.session.rest,
            "DELETE",
            Routes.CHANNEL_PIN(this.channelId, this.id),
        );
    }

    /** Edits the current message */
    async edit(options: EditMessage): Promise<Message> {
        const message = await this.session.rest.runMethod(
            this.session.rest,
            "POST",
            Routes.CHANNEL_MESSAGE(this.id, this.channelId),
            {
                content: options.content,
                allowed_mentions: {
                    parse: options.allowedMentions?.parse,
                    roles: options.allowedMentions?.roles,
                    users: options.allowedMentions?.users,
                    replied_user: options.allowedMentions?.repliedUser,
                },
                flags: options.flags,
                embeds: options.embeds,
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
                embeds: options.embeds,
                tts: options.tts,
            },
        );

        return new Message(this.session, message);
    }

    /**
     * alias for Message.addReaction
     */
    get react() {
        return this.addReaction;
    }

    async addReaction(reaction: ReactionResolvable) {
        const r = typeof reaction === "string" ? reaction : `${reaction.name}:${reaction.id}`;

        await this.session.rest.runMethod<undefined>(
            this.session.rest,
            "PUT",
            Routes.CHANNEL_MESSAGE_REACTION_ME(this.channelId, this.id, r),
            {},
        );
    }

    async removeReaction(reaction: ReactionResolvable, options?: { userId: Snowflake }) {
        const r = typeof reaction === "string" ? reaction : `${reaction.name}:${reaction.id}`;

        await this.session.rest.runMethod<undefined>(
            this.session.rest,
            "DELETE",
            options?.userId
                ? Routes.CHANNEL_MESSAGE_REACTION_USER(
                    this.channelId,
                    this.id,
                    r,
                    options.userId,
                )
                : Routes.CHANNEL_MESSAGE_REACTION_ME(this.channelId, this.id, r),
        );
    }

    /**
     * Get users who reacted with this emoji
     */
    async fetchReactions(reaction: ReactionResolvable, options?: GetReactions): Promise<User[]> {
        const r = typeof reaction === "string" ? reaction : `${reaction.name}:${reaction.id}`;

        const users = await this.session.rest.runMethod<DiscordUser[]>(
            this.session.rest,
            "GET",
            Routes.CHANNEL_MESSAGE_REACTION(this.channelId, this.id, encodeURIComponent(r), options),
        );

        return users.map((user) => new User(this.session, user));
    }

    async removeReactionEmoji(reaction: ReactionResolvable) {
        const r = typeof reaction === "string" ? reaction : `${reaction.name}:${reaction.id}`;

        await this.session.rest.runMethod<undefined>(
            this.session.rest,
            "DELETE",
            Routes.CHANNEL_MESSAGE_REACTION(this.channelId, this.id, r),
        );
    }

    async nukeReactions() {
        await this.session.rest.runMethod<undefined>(
            this.session.rest,
            "DELETE",
            Routes.CHANNEL_MESSAGE_REACTIONS(this.channelId, this.id),
        );
    }

    async crosspost() {
        const message = await this.session.rest.runMethod<DiscordMessage>(
            this.session.rest,
            "POST",
            Routes.CHANNEL_MESSAGE_CROSSPOST(this.channelId, this.id),
        );

        return new Message(this.session, message);
    }

    /*
     * alias of Message.crosspost
     * */
    get publish() {
        return this.crosspost;
    }

    /** wheter the message comes from a guild **/
    inGuild(): this is Message & { guildId: Snowflake } {
        return !!this.guildId;
    }

    /** wheter the messages comes from a Webhook */
    isWebhookMessage(): this is Message & { author: Partial<User>; webhook: WebhookAuthor; member: undefined } {
        return !!this.webhook;
    }
}

export default Message;
