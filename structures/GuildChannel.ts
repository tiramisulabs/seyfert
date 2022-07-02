import type { Model } from "./Base.ts";
import type { Snowflake } from "../util/Snowflake.ts";
import type { Session } from "../session/Session.ts";
import type { ChannelTypes, DiscordChannel, DiscordWebhook, DiscordInviteMetadata } from "../vendor/external.ts";
import { urlToBase64 } from "../util/urlToBase64.ts";
import BaseChannel from "./BaseChannel.ts";
import Invite from "./Invite.ts";
import Webhook from "./Webhook.ts";
import ThreadChannel from "./ThreadChannel.ts";
import * as Routes from "../util/Routes.ts";

export interface CreateWebhook {
    name: string;
    avatar?: string;
    reason?: string;
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

export class GuildChannel extends BaseChannel implements Model {
    constructor(session: Session, data: DiscordChannel, guildId: Snowflake) {
        super(session, data);
        this.type = data.type as number
        this.guildId = guildId;
        this.position = data.position;
        data.topic ? this.topic = data.topic : null;
        data.parent_id ? this.parentId = data.parent_id : undefined;
    }

    override type: Exclude<ChannelTypes, ChannelTypes.DM | ChannelTypes.GroupDm>;
    guildId: Snowflake;
    topic?: string;
    position?: number;
    parentId?: Snowflake;

    async fetchInvites(): Promise<Invite[]> {
        const invites = await this.session.rest.runMethod<DiscordInviteMetadata[]>(
            this.session.rest,
            "GET",
            Routes.CHANNEL_INVITES(this.id),
        );

        return invites.map((invite) => new Invite(this.session, invite));
    }

    async delete(reason?: string) {
        await this.session.rest.runMethod<DiscordChannel>(
            this.session.rest,
            "DELETE",
            Routes.CHANNEL(this.id),
            {
                reason,
            },
        );
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

    async createWebhook(options: CreateWebhook) {
        const webhook = await this.session.rest.runMethod<DiscordWebhook>(
            this.session.rest,
            "POST",
            Routes.CHANNEL_WEBHOOKS(this.id),
            {
                name: options.name,
                avatar: options.avatar ? urlToBase64(options.avatar) : undefined,
                reason: options.reason,
            }
        );

        return new Webhook(this.session, webhook);
    }
}

export default GuildChannel;
