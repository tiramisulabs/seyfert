import type { Model } from "./Base.ts";
import type { DiscordRole } from "../../discordeno/mod.ts";
import type { Session } from "../Session.ts";
import { Snowflake } from "../Snowflake.ts";
import Permissions from "./Permissions.ts";
import Util from "../Util.ts";
import { Guild, ModifyGuildRole } from "./guilds.ts";

export class Role implements Model {
    constructor(session: Session, data: DiscordRole, guildId: Snowflake) {
        this.session = session;
        this.id = data.id;
        this.guildId = guildId;
        this.hoist = data.hoist;
        this.iconHash = data.icon ? Util.iconHashToBigInt(data.icon) : undefined;
        this.color = data.color;
        this.name = data.name;
        this.unicodeEmoji = data.unicode_emoji;
        this.mentionable = data.mentionable;
        this.managed = data.managed;
        this.permissions = new Permissions(BigInt(data.permissions));
    }

    readonly session: Session;
    readonly id: Snowflake;

    readonly guildId: Snowflake;

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
        await Guild.prototype.deleteRole.call({ id: this.guildId, session: this.session }, this.id);
    }

    async edit(options: ModifyGuildRole) {
        const role = await Guild.prototype.editRole.call({ id: this.guildId, session: this.session }, this.id, options);
        return role;
    }

    async add(memberId: Snowflake, options: { reason?: string } = {}) {
        await Guild.prototype.addRole.call({ id: this.guildId, session: this.session }, memberId, this.id, options);
    }

    async remove(memberId: Snowflake, options: { reason?: string } = {}) {
        await Guild.prototype.removeRole.call({ id: this.guildId, session: this.session }, memberId, this.id, options);
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

export default Role;
