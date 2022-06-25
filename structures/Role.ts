import type { Model } from "./Base.ts";
import type { Session } from "../session/Session.ts";
import type { DiscordRole } from "../vendor/external.ts";
import { Snowflake, Routes } from "../mod.ts";
import { iconHashToBigInt } from "../util/hash.ts";

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

    get createdTimestamp() {
        return Snowflake.snowflakeToTimestamp(this.id);
    }

    get createdAt() {
        return new Date(this.createdTimestamp);
    }

    get hexColor() {
        return `#${this.color.toString(16).padStart(6, "0")}`;
    }

    async delete() {
        await this.session.rest.runMethod<undefined>(this.session.rest, "DELETE", Routes.GUILD_ROLE(this.guildId, this.id));
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
