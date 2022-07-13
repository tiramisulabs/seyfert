import type { Model } from "./Base.ts";
import type { Session } from "../Session.ts";
import type { DiscordGuild, GuildNsfwLevel, VerificationLevels } from "../../discordeno/mod.ts";
import type { ImageFormat, ImageSize } from "../Util.ts";
import { GuildFeatures } from "../../discordeno/mod.ts";
import { Snowflake } from "../Snowflake.ts";
import Util from "../Util.ts";
import * as Routes from "../Routes.ts";
import WelcomeScreen from "./WelcomeScreen.ts";

/** BaseGuild */
/**
 * Class for {@link Guild} and {@link AnonymousGuild}
 */
export abstract class BaseGuild implements Model {
    constructor(session: Session, data: DiscordGuild) {
        this.session = session;
        this.id = data.id;

        this.name = data.name;
        this.iconHash = data.icon ? Util.iconHashToBigInt(data.icon) : undefined;

        this.features = data.features;
    }

    readonly session: Session;
    readonly id: Snowflake;

    name: string;
    iconHash?: bigint;
    features: GuildFeatures[];

    get createdTimestamp() {
        return Snowflake.snowflakeToTimestamp(this.id);
    }

    get createdAt() {
        return new Date(this.createdTimestamp);
    }

    get partnered() {
        return this.features.includes(GuildFeatures.Partnered);
    }

    get verified() {
        return this.features.includes(GuildFeatures.Verified);
    }

    iconURL(options: { size?: ImageSize; format?: ImageFormat } = { size: 128 }) {
        if (this.iconHash) {
            return Util.formatImageURL(
                Routes.GUILD_ICON(this.id, Util.iconBigintToHash(this.iconHash)),
                options.size,
                options.format,
            );
        }
    }

    toString() {
        return this.name;
    }
}

export default BaseGuild;

/** AnonymousGuild */
export class AnonymousGuild extends BaseGuild implements Model {
    constructor(session: Session, data: Partial<DiscordGuild>); // TODO: Improve this type (name and id are required)
    constructor(session: Session, data: DiscordGuild) {
        super(session, data);

        this.splashHash = data.splash ? Util.iconHashToBigInt(data.splash) : undefined;
        this.bannerHash = data.banner ? Util.iconHashToBigInt(data.banner) : undefined;

        this.verificationLevel = data.verification_level;
        this.vanityUrlCode = data.vanity_url_code ? data.vanity_url_code : undefined;
        this.nsfwLevel = data.nsfw_level;
        this.description = data.description ? data.description : undefined;
        this.premiumSubscriptionCount = data.premium_subscription_count;
    }

    splashHash?: bigint;
    bannerHash?: bigint;

    verificationLevel: VerificationLevels;
    vanityUrlCode?: string;
    nsfwLevel: GuildNsfwLevel;
    description?: string;
    premiumSubscriptionCount?: number;

    splashURL(options: { size?: ImageSize; format?: ImageFormat } = { size: 128 }) {
        if (this.splashHash) {
            return Util.formatImageURL(
                Routes.GUILD_SPLASH(this.id, Util.iconBigintToHash(this.splashHash)),
                options.size,
                options.format,
            );
        }
    }

    bannerURL(options: { size?: ImageSize; format?: ImageFormat } = { size: 128 }) {
        if (this.bannerHash) {
            return Util.formatImageURL(
                Routes.GUILD_BANNER(this.id, Util.iconBigintToHash(this.bannerHash)),
                options.size,
                options.format,
            );
        }
    }
}

/** InviteGuild */
export class InviteGuild extends AnonymousGuild implements Model {
    constructor(session: Session, data: Partial<DiscordGuild>) {
        super(session, data);

        if (data.welcome_screen) {
            this.welcomeScreen = new WelcomeScreen(session, data.welcome_screen);
        }
    }

    welcomeScreen?: WelcomeScreen;
}