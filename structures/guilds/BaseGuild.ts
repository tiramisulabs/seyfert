import type { Model } from "../Base.ts";
import type { Session } from "../../session/Session.ts";
import type { DiscordGuild } from "../../vendor/external.ts";
import type { ImageFormat, ImageSize } from "../../util/shared/images.ts";
import { formatImageUrl } from "../../util/shared/images.ts";
import { iconBigintToHash, iconHashToBigInt } from "../../util/hash.ts";
import { GuildFeatures } from "../../vendor/external.ts";
import { Snowflake } from "../../util/Snowflake.ts";
import * as Routes from "../../util/Routes.ts";

/**
 * Class for {@link Guild} and {@link AnonymousGuild}
 */
export abstract class BaseGuild implements Model {
    constructor(session: Session, data: DiscordGuild) {
        this.session = session;
        this.id = data.id;

        this.name = data.name;
        this.iconHash = data.icon ? iconHashToBigInt(data.icon) : undefined;

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

    iconUrl(options: { size?: ImageSize; format?: ImageFormat } = { size: 128 }) {
        if (this.iconHash) {
            return formatImageUrl(
                Routes.GUILD_BANNER(this.id, iconBigintToHash(this.iconHash)),
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
