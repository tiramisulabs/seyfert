import type { Model } from "./Base.ts";
import type { Session } from "../session/Session.ts";
import type { Snowflake } from "../util/Snowflake.ts";
import type { DiscordWebhook, WebhookTypes } from "../vendor/external.ts";
import { iconHashToBigInt } from "../util/hash.ts";
import User from "./User.ts";

export class Webhook implements Model {
    constructor(session: Session, data: DiscordWebhook) {
        this.session = session;
        this.id = data.id;
        this.type = data.type;
        this.token = data.token;

        if (data.avatar) {
            this.avatar = iconHashToBigInt(data.avatar);
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
}

export default Webhook;
