import type { Model } from "./Base.ts";
import type { Session } from "../session/Session.ts";
import type { DiscordRole } from "../vendor/external.ts";
import { Snowflake } from "../util/Snowflake.ts";
import { iconHashToBigInt } from "../util/hash.ts";
import { Guild } from "./Guild.ts";

export class Role implements Model {
    constructor(session: Session, guild: Guild, data: DiscordRole) {
        this.session = session;
        this.id = data.id;
        this.guild = guild;
        this.hoist = data.hoist;
        this.iconHash = data.icon ? iconHashToBigInt(data.icon) : undefined;
        this.color = data.color;
        this.name = data.name;
        this.unicodeEmoji = data.unicode_emoji;
        this.mentionable = data.mentionable;
        this.managed = data.managed;
    }

    session: Session;
    id: Snowflake;
    guild: Guild;
    hoist: boolean;
    iconHash?: bigint;
    color: number;
    name: string;
    unicodeEmoji?: string;
    mentionable: boolean;
    managed: boolean;

    get createdTimestamp() {
        return Snowflake.snowflakeToTimestamp(this.id);
    }

    get createdAt() {
        return new Date(this.createdTimestamp);
    }

    get hexColor() {
        return `#${this.color.toString(16).padStart(6, "0")}`;
    }

    /*
     * delete() {
     *     return.this.guild.deleteRole(this.id);
     * }
     * edit() {
     *     return this.guild.editRole(this.id);
     * }
     * */

    toString() {
        switch (this.id) {
            case this.guild.id:
                return "@everyone";
            default:
                return `<@&${this.id}>`;
        }
    }
}
