import type { Session } from "../session/Session.ts";
import type { Snowflake } from "../util/Snowflake.ts";
import type { GetMessagesOptions } from "../util/Routes.ts";
import type { DiscordChannel, DiscordInvite, DiscordMessage, TargetTypes } from "../vendor/external.ts";
import { GuildChannel } from "./GuildChannel.ts";
import { Guild } from "./Guild.ts";
import { ThreadChannel } from "./ThreadChannel.ts";
import { Message } from "./Message.ts";
import { Invite } from "./Invite.ts";
import { Routes } from "../util/mod.ts";

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

/**
 * Represent the options object to create a Thread Channel
 * @link https://discord.com/developers/docs/resources/channel#start-thread-without-message
 */
export interface ThreadCreateOptions {
    name: string;
    autoArchiveDuration: 60 | 1440 | 4320 | 10080;
    type: 10 | 11 | 12;
    invitable?: boolean;
    reason?: string;
}

export class TextChannel extends GuildChannel {
    constructor(session: Session, data: DiscordChannel, guildId: Guild["id"]) {
        super(session, data, guildId);
        data.last_message_id ? this.lastMessageId = data.last_message_id : undefined;
        data.last_pin_timestamp ? this.lastPinTimestamp = data.last_pin_timestamp : undefined;
        this.rateLimitPerUser = data.rate_limit_per_user ?? 0;
        this.nsfw = !!data.nsfw ?? false;
    }

    lastMessageId?: Snowflake;
    lastPinTimestamp?: string;
    rateLimitPerUser: number;
    nsfw: boolean;

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

    async createThread(options: ThreadCreateOptions): Promise<ThreadChannel> {
        const thread = await this.session.rest.runMethod<DiscordChannel>(
            this.session.rest,
            "POST",
            Routes.CHANNEL_CREATE_THREAD(this.id),
            options,
        );
        return new ThreadChannel(this.session, thread, this.guildId);
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
}

export default TextChannel;
