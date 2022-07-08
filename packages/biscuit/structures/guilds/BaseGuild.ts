import type { Model } from "../Base.ts";
import type { Session } from "../../Session.ts";
import type { DiscordGuild } from "../../../discordeno/mod.ts";
import type { ImageFormat, ImageSize } from "../../Util.ts";
import { GuildFeatures } from "../../../discordeno/mod.ts";
import { Snowflake } from "../../Snowflake.ts";
import Util from "../../Util.ts";
import * as Routes from "../../Routes.ts";

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
