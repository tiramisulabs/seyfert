import type { Model } from './Base.ts';
import type { Session } from '../Session.ts';
import type {
    AllowedMentionsTypes,
    DiscordEmbed,
    DiscordMessage,
    DiscordMessageComponents,
    DiscordUser,
    FileContent,
    MessageActivityTypes,
    MessageTypes,
} from '../../discordeno/mod.ts';
import type { Channel } from './channels.ts';
import type { Component } from './components/Component.ts';
import type { GetReactions } from '../Routes.ts';
import type { MessageInteraction } from './interactions/InteractionFactory.ts';
import { MessageFlags } from '../Util.ts';
import { Snowflake } from '../Snowflake.ts';
import { ChannelFactory, ThreadChannel } from './channels.ts';
import Util from '../Util.ts';
import User from './User.ts';
import Member from './Member.ts';
import Attachment from './Attachment.ts';
import ComponentFactory from './components/ComponentFactory.ts';
import MessageReaction from './MessageReaction.ts';
import Application, { NewTeam } from './Application.ts';
import InteractionFactory from './interactions/InteractionFactory.ts';
import * as Routes from '../Routes.ts';
import { StickerItem } from './Sticker.ts';

/**
 * @link https://discord.com/developers/docs/resources/channel#allowed-mentions-object
 */
export interface AllowedMentions {
    parse?: AllowedMentionsTypes[];
    repliedUser?: boolean;
    roles?: Snowflake[];
    users?: Snowflake[];
}

/**
 * @link https://github.com/denoland/deno_doc/blob/main/lib/types.d.ts
 * channelId is optional when creating a reply, but will always be present when receiving an event/response that includes this data model.
 */
export interface CreateMessageReference {
    messageId: Snowflake;
    channelId?: Snowflake;
    guildId?: Snowflake;
    failIfNotExists?: boolean;
}

/**
 * @link https://discord.com/developers/docs/resources/channel#create-message-json-params
 * Posts a message to a guild text or DM channel. Returns a message object. Fires a Message Create Gateway event.
 */
export interface CreateMessage {
    embeds?: DiscordEmbed[];
    content?: string;
    allowedMentions?: AllowedMentions;
    files?: FileContent[];
    messageReference?: CreateMessageReference;
    tts?: boolean;
    components?: DiscordMessageComponents;
}

/**
 * @link https://discord.com/developers/docs/resources/channel#edit-message-json-params
 * Edit a previously sent message.
 * Returns a {@link Message} object. Fires a Message Update Gateway event.
 */
export interface EditMessage extends Partial<CreateMessage> {
    flags?: MessageFlags;
}

/**
 * Represents a guild or unicode {@link Emoji}
 */
export type EmojiResolvable = string | {
    name: string;
    id: Snowflake;
};

/**
 * A partial {@link User} to represent the author of a message sent by a webhook
 */
export interface WebhookAuthor {
    id: string;
    username: string;
    discriminator: string;
    avatar?: bigint;
}

/**
 * @link https://discord.com/developers/docs/resources/channel#message-object
 * Represents a message
 */
export class Message implements Model {
    constructor(session: Session, data: DiscordMessage) {
        this.session = session;
        this.id = data.id;

        this.type = data.type;
        this.channelId = data.channel_id;
        this.guildId = data.guild_id;
        this.applicationId = data.application_id;

        this.mentions = {
            users: data.mentions?.map((user) => new User(session, user)) ?? [],
            roleIds: data.mention_roles ?? [],
            channels: data.mention_channels?.map((channel) => ChannelFactory.from(session, channel)) ?? [],
        };

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

        if (data.interaction) {
            this.interaction = InteractionFactory.fromMessage(session, data.interaction, data.guild_id);
        }

        if (data.thread && data.guild_id) {
            this.thread = new ThreadChannel(session, data.thread, data.guild_id);
        }

        // webhook handling
        if (data.webhook_id && data.author.discriminator === '0000') {
            this.webhook = {
                id: data.webhook_id!,
                username: data.author.username,
                discriminator: data.author.discriminator,
                avatar: data.author.avatar ? Util.iconHashToBigInt(data.author.avatar) : undefined,
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

        if (data.sticker_items) {
            this.stickers = data.sticker_items.map((si) => {
                return {
                    id: si.id,
                    name: si.name,
                    formatType: si.format_type,
                };
            });
        }

        if (data.application) {
            const application: Partial<Application> = {
                id: data.application.id,
                icon: data.application.icon ? data.application.icon : undefined,
                name: data.application.name,
                guildId: data.application.guild_id,
                flags: data.application.flags,
                botPublic: data.application.bot_public,
                owner: data.application.owner ? new User(session, data.application.owner as DiscordUser) : undefined,
                botRequireCodeGrant: data.application.bot_require_code_grant,
                coverImage: data.application.cover_image,
                customInstallURL: data.application.custom_install_url,
                description: data.application.description,
                installParams: data.application.install_params,
                tags: data.application.tags,
                verifyKey: data.application.verify_key,
                team: data.application.team ? NewTeam(session, data.application.team) : undefined,
                primarySkuId: data.application.primary_sku_id,
                privacyPolicyURL: data.application.privacy_policy_url,
                rpcOrigins: data.application.rpc_origins,
                slug: data.application.slug,
            };

            Object.setPrototypeOf(application, Application.prototype);

            this.application = application;
        }
    }

    /** Reference to the client that instantiated this Message */
    readonly session: Session;

    /** id of the message */
    readonly id: Snowflake;

    /** type of message */
    type: MessageTypes;

    /** id of the channel the message was sent in */
    channelId: Snowflake;

    /** id of the guild the message was sent in, this should exist on MESSAGE_CREATE and MESSAGE_UPDATE events */
    guildId?: Snowflake;

    /** if the message is an Interaction or application-owned webhook, this is the id of the application */
    applicationId?: Snowflake;

    /** mentions if any */
    mentions: {
        /** users specifically mentioned in the message */
        users: User[];

        /** roles specifically mentioned in this message */
        roleIds: Snowflake[];

        /** channels specifically mentioned in the message */
        channels: Channel[];
    };

    /** sent if the message is a response to an Interaction */
    interaction?: MessageInteraction;

    /** the author of this message, this field is **not** sent on webhook messages */
    author!: User;

    /** message flags combined as a bitfield */
    flags?: MessageFlags;

    /** whether this message is pinned */
    pinned: boolean;

    /** whether this was a TTS message */
    tts: boolean;

    /** contents of the message */
    content: string;

    /** used for validating a message was sent */
    nonce?: string | number;

    /** whether this message mentions everyone */
    mentionEveryone: boolean;

    /** when this message was sent */
    timestamp: number;

    /** when this message was edited */
    editedTimestamp?: number;

    /**
     * sent if the message contains stickers
     * **this contains sticker items not stickers**
     */
    stickers?: StickerItem[];

    /** reactions to the message */
    reactions: MessageReaction[];

    /** any attached files */
    attachments: Attachment[];

    /** any embedded content */
    embeds: DiscordEmbed[];

    /** member properties for this message's author */
    member?: Member;

    /** the thread that was started from this message, includes {@link ThreadMember} */
    thread?: ThreadChannel;

    /** sent if the message contains components like buttons, action rows, or other interactive components */
    components: Component[];

    /** if the message is generated by a webhook, this is the webhook's author data */
    webhook?: WebhookAuthor;

    /** sent with Rich Presence-related chat embeds */
    application?: Partial<Application>;

    /** sent with Rich Presence-related chat embeds */
    activity?: {
        partyId?: Snowflake;
        type: MessageActivityTypes;
    };

    /** gets the timestamp of this message, this does not requires the timestamp field */
    get createdTimestamp(): number {
        return Snowflake.snowflakeToTimestamp(this.id);
    }

    /** gets the timestamp of this message as a Date */
    get createdAt(): Date {
        return new Date(this.createdTimestamp);
    }

    /** gets the timestamp of this message (sent by the API) */
    get sentAt(): Date {
        return new Date(this.timestamp);
    }

    /** gets the edited timestamp as a Date */
    get editedAt(): Date | undefined {
        return this.editedTimestamp ? new Date(this.editedTimestamp) : undefined;
    }

    /** whether this message was edited */
    get edited(): number | undefined {
        return this.editedTimestamp;
    }

    /** gets the url of the message that points to the message */
    get url(): string {
        return `https://discord.com/channels/${this.guildId ?? '@me'}/${this.channelId}/${this.id}`;
    }

    /**
     * Compatibility with Discordeno
     * same as Message.author.bot
     */
    get isBot(): boolean {
        return this.author.bot;
    }

    /**
     * Pins this message
     */
    async pin(): Promise<void> {
        await this.session.rest.runMethod<undefined>(
            this.session.rest,
            'PUT',
            Routes.CHANNEL_PIN(this.channelId, this.id),
        );
    }

    /**
     * Unpins this message
     */
    async unpin(): Promise<void> {
        await this.session.rest.runMethod<undefined>(
            this.session.rest,
            'DELETE',
            Routes.CHANNEL_PIN(this.channelId, this.id),
        );
    }

    /** Edits the current message */
    async edit(options: EditMessage): Promise<Message> {
        const message = await this.session.rest.runMethod(
            this.session.rest,
            'POST',
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

    /** edits the current message flags to supress its embeds */
    async suppressEmbeds(suppress: true): Promise<Message>;
    async suppressEmbeds(suppress: false): Promise<Message | undefined>;
    async suppressEmbeds(suppress = true) {
        if (this.flags === MessageFlags.SupressEmbeds && suppress === false) {
            return;
        }

        const message = await this.edit({ flags: MessageFlags.SupressEmbeds });

        return message;
    }

    /** deletes this message */
    async delete(reason?: string): Promise<Message> {
        await this.session.rest.runMethod<undefined>(
            this.session.rest,
            'DELETE',
            Routes.CHANNEL_MESSAGE(this.channelId, this.id),
            { reason },
        );

        return this;
    }

    /** Replies directly in the channel where the message was sent */
    async reply(options: CreateMessage): Promise<Message> {
        const message = await this.session.rest.runMethod<DiscordMessage>(
            this.session.rest,
            'POST',
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
                components: options.components,
            },
        );

        return new Message(this.session, message);
    }

    /** alias for Message.addReaction */
    get react() {
        return this.addReaction;
    }

    /** adds a Reaction */
    async addReaction(reaction: EmojiResolvable): Promise<void> {
        const r = typeof reaction === 'string' ? reaction : `${reaction.name}:${reaction.id}`;

        await this.session.rest.runMethod<undefined>(
            this.session.rest,
            'PUT',
            Routes.CHANNEL_MESSAGE_REACTION_ME(this.channelId, this.id, r),
            {},
        );
    }

    /** removes a reaction from someone */
    async removeReaction(reaction: EmojiResolvable, options?: { userId: Snowflake }): Promise<void> {
        const r = typeof reaction === 'string' ? reaction : `${reaction.name}:${reaction.id}`;

        await this.session.rest.runMethod<undefined>(
            this.session.rest,
            'DELETE',
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
     * not recommended since the cache handles reactions already
     */
    async fetchReactions(reaction: EmojiResolvable, options?: GetReactions): Promise<User[]> {
        const r = typeof reaction === 'string' ? reaction : `${reaction.name}:${reaction.id}`;

        const users = await this.session.rest.runMethod<DiscordUser[]>(
            this.session.rest,
            'GET',
            Routes.CHANNEL_MESSAGE_REACTION(this.channelId, this.id, encodeURIComponent(r), options),
        );

        return users.map((user) => new User(this.session, user));
    }

    /**
     * same as Message.removeReaction but removes using a unicode emoji
     */
    async removeReactionEmoji(reaction: EmojiResolvable): Promise<void> {
        const r = typeof reaction === 'string' ? reaction : `${reaction.name}:${reaction.id}`;

        await this.session.rest.runMethod<undefined>(
            this.session.rest,
            'DELETE',
            Routes.CHANNEL_MESSAGE_REACTION(this.channelId, this.id, r),
        );
    }

    /** nukes every reaction on the message */
    async nukeReactions(): Promise<void> {
        await this.session.rest.runMethod<undefined>(
            this.session.rest,
            'DELETE',
            Routes.CHANNEL_MESSAGE_REACTIONS(this.channelId, this.id),
        );
    }

    /** publishes/crossposts a message to all followers */
    async crosspost(): Promise<Message> {
        const message = await this.session.rest.runMethod<DiscordMessage>(
            this.session.rest,
            'POST',
            Routes.CHANNEL_MESSAGE_CROSSPOST(this.channelId, this.id),
        );

        return new Message(this.session, message);
    }

    /** fetches this message, meant to be used with Function.call since its redundant */
    async fetch(): Promise<(Message | undefined)> {
        const message = await this.session.rest.runMethod<DiscordMessage>(
            this.session.rest,
            'GET',
            Routes.CHANNEL_MESSAGE(this.channelId, this.id),
        );

        if (!message?.id) return;

        return new Message(this.session, message);
    }

    /** alias of Message.crosspost */
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
