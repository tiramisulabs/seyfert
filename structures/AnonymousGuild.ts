import type { Model } from "./Base.ts";
import type { Session } from "../session/Session.ts";
import type { DiscordGuild, GuildNsfwLevel, VerificationLevels } from "../vendor/external.ts";
import { iconHashToBigInt } from "../util/hash.ts";
import { BaseGuild } from "./BaseGuild.ts";

export abstract class AnonymousGuild extends BaseGuild implements Model {
    constructor(session: Session, data: DiscordGuild) {
        super(session, data);

        this.splashHash = data.splash ? iconHashToBigInt(data.splash) : undefined;
        this.bannerHash = data.banner ? iconHashToBigInt(data.banner) : undefined;

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

    // TODO: bannerUrl and splashUrl
}

export default AnonymousGuild;
