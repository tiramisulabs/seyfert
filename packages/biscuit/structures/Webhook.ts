import type { Model } from "./Base.ts";
import type { Session } from "../Session.ts";
import type { Snowflake } from "../Snowflake.ts";
import type { DiscordMessage, DiscordWebhook, WebhookTypes } from "../../discordeno/mod.ts";
import type { WebhookOptions } from "../Routes.ts";
import type { CreateMessage } from "./Message.ts";
import Util from "../Util.ts";
import User from "./User.ts";
import Message from "./Message.ts";
import * as Routes from "../Routes.ts";

export class Webhook implements Model {
    constructor(session: Session, data: DiscordWebhook) {
        this.session = session;
        this.id = data.id;
        this.type = data.type;
        this.token = data.token;

        if (data.avatar) {
            this.avatar = Util.iconHashToBigInt(data.avatar);
        }

        if (data.user) {
            this.user = new User(session, data.user);
        }

        if (data.guild_id) {
            this.guildId = data.guild_id;
        }

        if (data.channel_id) {
            this.channelId = data.channel_id;
        }

        if (data.application_id) {
            this.applicationId = data.application_id;
        }
    }

    readonly session: Session;
    readonly id: Snowflake;
    type: WebhookTypes;
    token?: string;
    avatar?: bigint;
    applicationId?: Snowflake;
    channelId?: Snowflake;
    guildId?: Snowflake;
    user?: User;

    async execute(options?: WebhookOptions & CreateMessage & { avatarUrl?: string; username?: string }) {
        if (!this.token) {
            return;
        }

        const data = {
            content: options?.content,
            embeds: options?.embeds,
            tts: options?.tts,
            allowed_mentions: options?.allowedMentions,
            // @ts-ignore: TODO: component builder or something
            components: options?.components,
            file: options?.files,
        };

        const message = await this.session.rest.sendRequest<DiscordMessage>(this.session.rest, {
            url: Routes.WEBHOOK(this.id, this.token!, {
                wait: options?.wait,
                threadId: options?.threadId,
            }),
            method: "POST",
            payload: this.session.rest.createRequestBody(this.session.rest, {
                method: "POST",
                body: {
                    ...data,
                },
            }),
        });

        return (options?.wait ?? true) ? new Message(this.session, message) : undefined;
    }

    async fetch() {
        const message = await this.session.rest.runMethod<DiscordWebhook>(
            this.session.rest,
            "GET",
            Routes.WEBHOOK_TOKEN(this.id, this.token),
        );

        return new Webhook(this.session, message);
    }

    async fetchMessage(messageId: Snowflake) {
        if (!this.token) {
            return;
        }

        const message = await this.session.rest.runMethod<DiscordMessage>(
            this.session.rest,
            "GET",
            Routes.WEBHOOK_MESSAGE(this.id, this.token, messageId),
        );

        return new Message(this.session, message);
    }
}

export default Webhook;
