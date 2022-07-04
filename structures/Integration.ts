import type { Model } from "./Base.ts";
import type { Snowflake } from "../util/Snowflake.ts";
import type { Session } from "../session/Session.ts";
import type {
    DiscordIntegration,
    DiscordIntegrationAccount,
    DiscordIntegrationApplication,
    DiscordUser,
    IntegrationExpireBehaviors
} from "../vendor/external.ts";

export class Integration implements Model {
    constructor(session: Session, data: DiscordIntegration & { guild_id?: string }) {
        this.id = data.id;
        this.session = session;

        data.guild_id ? this.guildId = data.guild_id : null;

        this.name = data.name;
        this.type = data.type;
        this.enabled = !!data.enabled;
        this.syncing = !!data.syncing;
        this.roleId = data.role_id;
        this.enableEmoticons = !!data.enable_emoticons;
        this.expireBehavior = data.expire_behavior;
        this.expireGracePeriod = data.expire_grace_period;
        this.syncedAt = data.synced_at;
        this.subscriberCount = data.subscriber_count;
        this.revoked = !!data.revoked;

        this.user = data.user;
        this.account = data.account;
        this.application = data.application;
    }

    id: Snowflake;
    session: Session;
    guildId?: string;

    name: string
    type: "twitch" | "youtube" | "discord";
    enabled?: boolean;
    syncing?: boolean;
    roleId?: string;
    enableEmoticons?: boolean;
    expireBehavior?: IntegrationExpireBehaviors;
    expireGracePeriod?: number;
    syncedAt?: string;
    subscriberCount?: number;
    revoked?: boolean;

    user?: DiscordUser;
    account?: DiscordIntegrationAccount;
    application?: DiscordIntegrationApplication;
}