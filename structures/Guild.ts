import type { Model } from "./Base.ts";
import type { Snowflake } from "../util/Snowflake.ts";
import type { Session } from "../session/Session.ts";
import type { DiscordGuild, DiscordMember, MakeRequired } from "../vendor/external.ts";
import { DefaultMessageNotificationLevels, ExplicitContentFilterLevels, VerificationLevels } from "../vendor/external.ts";
import { iconHashToBigInt, iconBigintToHash as _iconBigintToHash } from "../util/hash.ts";
import { Member } from "./Member.ts";
import { BaseGuild } from "./BaseGuild.ts";

/**
 * Represents a guild
 * @link https://discord.com/developers/docs/resources/guild#guild-object
 * */
export class Guild extends BaseGuild implements Model {
    constructor(session: Session, data: DiscordGuild) {
        super(session, data);

        this.splashHash = data.splash ? iconHashToBigInt(data.splash) : undefined;
        this.discoverySplashHash = data.discovery_splash ? iconHashToBigInt(data.discovery_splash) : undefined;
        this.ownerId = data.owner_id;
        this.widgetEnabled = !!data.widget_enabled;
        this.widgetChannelId = data.widget_channel_id ? data.widget_channel_id : undefined;
        this.vefificationLevel = data.verification_level;
        this.defaultMessageNotificationLevel = data.default_message_notifications;
        this.explicitContentFilterLevel = data.explicit_content_filter;
        this.members = data.members?.map((member) => new Member(session, member as MakeRequired<DiscordMember, "user">)) ?? [];
    }

    splashHash?: bigint;
    discoverySplashHash?: bigint;
    ownerId: Snowflake;
    widgetEnabled: boolean;
    widgetChannelId?: Snowflake;
    vefificationLevel: VerificationLevels;
    defaultMessageNotificationLevel: DefaultMessageNotificationLevels;
    explicitContentFilterLevel: ExplicitContentFilterLevels;
    members: Member[];
}
