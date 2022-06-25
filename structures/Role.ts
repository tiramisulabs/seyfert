import type { Model } from "./Base.ts";
import type { Session } from "../session/Session.ts";
import type { DiscordRole } from "../vendor/external.ts";
import { Snowflake } from "../util/Snowflake.ts";
import { iconHashToBigInt } from "../util/hash.ts";
import { Permissions } from "./Permissions.ts";
import { Guild } from "./Guild.ts";

export class Role implements Model {
    constructor(session: Session, guildId: Snowflake, data: DiscordRole) {
        this.session = session;
        this.id = data.id;
        this.guildId = guildId;
        this.hoist = data.hoist;
        this.iconHash = data.icon ? iconHashToBigInt(data.icon) : undefined;
        this.color = data.color;
        this.name = data.name;
        this.unicodeEmoji = data.unicode_emoji;
        this.mentionable = data.mentionable;
        this.managed = data.managed;
        this.permissions = new Permissions(BigInt(data.permissions));
    }

    session: Session;
    id: Snowflake;
    guildId: Snowflake;
    hoist: boolean;
    iconHash?: bigint;
    color: number;
    name: string;
    unicodeEmoji?: string;
    mentionable: boolean;
    managed: boolean;
    permissions: Permissions;

    get createdTimestamp() {
        return Snowflake.snowflakeToTimestamp(this.id);
    }

    get createdAt() {
        return new Date(this.createdTimestamp);
    }

    get hexColor() {
        return `#${this.color.toString(16).padStart(6, "0")}`;
    }

    async delete(): Promise<void> {
        // cool jS trick
        await Guild.prototype.deleteRole.call({ id: this.guildId }, this.id);
    }

    toString() {
        switch (this.id) {
            case this.guildId:
                return "@everyone";
            default:
                return `<@&${this.id}>`;
        }
    }
}
