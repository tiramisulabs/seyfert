import type { Model } from "./Base.ts";
import type { Snowflake } from "../util/Snowflake.ts";
import type { Session } from "../session/Session.ts";
import type { DiscordGuild, DiscordMember, MakeRequired } from "../vendor/external.ts";
import { DefaultMessageNotificationLevels, ExplicitContentFilterLevels, VerificationLevels } from "../vendor/external.ts";
import { iconHashToBigInt, iconBigintToHash as _iconBigintToHash } from "../util/hash.ts";
import { Member } from "./Member.ts";

export class Guild implements Model {
    constructor(session: Session, data: DiscordGuild) {
        this.session = session;
        this.id = data.id;

        this.name = data.name;
        this.iconHash = data.icon ? iconHashToBigInt(data.icon) : undefined;
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

    readonly session: Session;
    readonly id: Snowflake;

    name: string;
    iconHash?: bigint;
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
