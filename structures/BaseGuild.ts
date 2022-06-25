import type { Model } from "./Base.ts";
import type { Session } from "../session/Session.ts";
import type { DiscordGuild, GuildFeatures } from "../vendor/external.ts";
import { Snowflake } from "../util/Snowflake.ts";
import { iconHashToBigInt } from "../util/hash.ts";

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

    toString() {
        return this.name;
    }
}
