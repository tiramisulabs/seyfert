// deno-lint-ignore-file ban-types
import type { Session } from "../../session/Session.ts";
import type { Snowflake } from "../../util/Snowflake.ts";
import type { GetMessagesOptions, GetReactions } from "../../util/Routes.ts";
import type {
    DiscordChannel,
    DiscordInvite,
    DiscordMessage,
    DiscordWebhook,
    TargetTypes,
} from "../../vendor/external.ts";
import type { CreateMessage, EditMessage, ReactionResolvable } from "../Message.ts";
import { ChannelTypes } from "../../vendor/external.ts";
import { urlToBase64 } from "../../util/urlToBase64.ts";
import Message from "../Message.ts";
import Invite from "../Invite.ts";
import Webhook from "../Webhook.ts";
import * as Routes from "../../util/Routes.ts";

/**
 * Represents the options object to create an invitation
 *  @link https://discord.com/developers/docs/resources/channel#create-channel-invite-json-params
 */
export interface DiscordInviteOptions {
    maxAge?: number;
    maxUses?: number;
    unique?: boolean;
    temporary: boolean;
    reason?: string;
    targetType?: TargetTypes;
    targetUserId?: Snowflake;
    targetApplicationId?: Snowflake;
}

export interface CreateWebhook {
    name: string;
    avatar?: string;
    reason?: string;
}

export const textBasedChannels = [
    ChannelTypes.DM,
    ChannelTypes.GroupDm,
    ChannelTypes.GuildPrivateThread,
    ChannelTypes.GuildPublicThread,
    ChannelTypes.GuildNews,
    ChannelTypes.GuildVoice,
    ChannelTypes.GuildText,
];

export type TextBasedChannels =
    | ChannelTypes.DM
    | ChannelTypes.GroupDm
    | ChannelTypes.GuildPrivateThread
    | ChannelTypes.GuildPublicThread
    | ChannelTypes.GuildNews
    | ChannelTypes.GuildVoice
    | ChannelTypes.GuildText;

export class TextChannel {
    constructor(session: Session, data: DiscordChannel) {
        this.session = session;
        this.id = data.id;
        this.name = data.name;
        this.type = data.type as number;
        this.rateLimitPerUser = data.rate_limit_per_user ?? 0;
        this.nsfw = !!data.nsfw ?? false;

        if (data.last_message_id) {
            this.lastMessageId = data.last_message_id;
        }

        if (data.last_pin_timestamp) {
            this.lastPinTimestamp = data.last_pin_timestamp;
        }
    }

    readonly session: Session;
    readonly id: Snowflake;
    name?: string;
    type: TextBasedChannels;
    lastMessageId?: Snowflake;
    lastPinTimestamp?: string;
    rateLimitPerUser: number;
    nsfw: boolean;

    /**
     * Mixin
     */
    static applyTo(klass: Function, ignore: Array<keyof TextChannel> = []) {
       const methods: Array<keyof TextChannel> = [
           "fetchPins",
           "createInvite",
           "fetchMessages",
           "sendTyping",
           "pinMessage",
           "unpinMessage",
           "addReaction",
           "removeReaction",
           "nukeReactions",
           "fetchPins",
           "sendMessage",
           "editMessage",
           "createWebhook",
       ];

       for (const method of methods) {
           if (ignore.includes(method)) continue;

           klass.prototype[method] = TextChannel.prototype[method];
       }
    }

    async fetchPins(): Promise<Message[] | []> {
        const messages = await this.session.rest.runMethod<DiscordMessage[]>(
            this.session.rest,
            "GET",
            Routes.CHANNEL_PINS(this.id),
        );
        return messages[0] ? messages.map((x: DiscordMessage) => new Message(this.session, x)) : [];
    }

    async createInvite(options?: DiscordInviteOptions) {
        const invite = await this.session.rest.runMethod<DiscordInvite>(
            this.session.rest,
            "POST",
            Routes.CHANNEL_INVITES(this.id),
            options
                ? {
                    max_age: options.maxAge,
                    max_uses: options.maxUses,
                    temporary: options.temporary,
                    unique: options.unique,
                    target_type: options.targetType,
                    target_user_id: options.targetUserId,
                    target_application_id: options.targetApplicationId,
                }
                : {},
        );

        return new Invite(this.session, invite);
    }

    async fetchMessages(options?: GetMessagesOptions): Promise<Message[] | []> {
        if (options?.limit! > 100) throw Error("Values must be between 0-100");
        const messages = await this.session.rest.runMethod<DiscordMessage[]>(
            this.session.rest,
            "GET",
            Routes.CHANNEL_MESSAGES(this.id, options),
        );
        return messages[0] ? messages.map((x) => new Message(this.session, x)) : [];
    }

    async sendTyping() {
        await this.session.rest.runMethod<undefined>(
            this.session.rest,
            "POST",
            Routes.CHANNEL_TYPING(this.id),
        );
    }

    async pinMessage(messageId: Snowflake) {
        await Message.prototype.pin.call({ id: messageId, channelId: this.id, session: this.session });
    }

    async unpinMessage(messageId: Snowflake) {
        await Message.prototype.unpin.call({ id: messageId, channelId: this.id, session: this.session });
    }

    async addReaction(messageId: Snowflake, reaction: ReactionResolvable) {
        await Message.prototype.addReaction.call(
            { channelId: this.id, id: messageId, session: this.session },
            reaction,
        );
    }

    async removeReaction(messageId: Snowflake, reaction: ReactionResolvable, options?: { userId: Snowflake }) {
        await Message.prototype.removeReaction.call(
            { channelId: this.id, id: messageId, session: this.session },
            reaction,
            options,
        );
    }

    async removeReactionEmoji(messageId: Snowflake, reaction: ReactionResolvable) {
        await Message.prototype.removeReactionEmoji.call(
            { channelId: this.id, id: messageId, session: this.session },
            reaction,
        );
    }

    async nukeReactions(messageId: Snowflake) {
        await Message.prototype.nukeReactions.call({ channelId: this.id, id: messageId });
    }

    async fetchReactions(messageId: Snowflake, reaction: ReactionResolvable, options?: GetReactions) {
        const users = await Message.prototype.fetchReactions.call(
            { channelId: this.id, id: messageId, session: this.session },
            reaction,
            options,
        );

        return users;
    }

    sendMessage(options: CreateMessage) {
        return Message.prototype.reply.call({ channelId: this.id, session: this.session }, options);
    }

    editMessage(messageId: Snowflake, options: EditMessage) {
        return Message.prototype.edit.call({ channelId: this.id, id: messageId, session: this.session }, options);
    }

    async createWebhook(options: CreateWebhook) {
        const webhook = await this.session.rest.runMethod<DiscordWebhook>(
            this.session.rest,
            "POST",
            Routes.CHANNEL_WEBHOOKS(this.id),
            {
                name: options.name,
                avatar: options.avatar ? urlToBase64(options.avatar) : undefined,
                reason: options.reason,
            },
        );

        return new Webhook(this.session, webhook);
    }
}

export default TextChannel;
