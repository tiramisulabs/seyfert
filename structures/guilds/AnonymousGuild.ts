import type { Model } from "../Base.ts";
import type { Session } from "../../session/Session.ts";
import type { DiscordGuild, GuildNsfwLevel, VerificationLevels } from "../../vendor/external.ts";
import type { ImageFormat, ImageSize } from "../../util/shared/images.ts";
import { iconBigintToHash, iconHashToBigInt } from "../../util/hash.ts";
import { formatImageURL } from "../../util/shared/images.ts";
import BaseGuild from "./BaseGuild.ts";
import * as Routes from "../../util/Routes.ts";

export class AnonymousGuild extends BaseGuild implements Model {
    constructor(session: Session, data: Partial<DiscordGuild>); // TODO: Improve this type (name and id are required)
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

    splashURL(options: { size?: ImageSize; format?: ImageFormat } = { size: 128 }) {
        if (this.splashHash) {
            return formatImageURL(
                Routes.GUILD_SPLASH(this.id, iconBigintToHash(this.splashHash)),
                options.size,
                options.format,
            );
        }
    }

    bannerURL(options: { size?: ImageSize; format?: ImageFormat } = { size: 128 }) {
        if (this.bannerHash) {
            return formatImageURL(
                Routes.GUILD_BANNER(this.id, iconBigintToHash(this.bannerHash)),
                options.size,
                options.format,
            );
        }
    }
}

export default AnonymousGuild;
