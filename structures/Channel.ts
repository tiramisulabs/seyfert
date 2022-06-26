import type { Model } from "./Base.ts";
import type { Snowflake } from "../util/Snowflake.ts";
import type { Session } from "../session/Session.ts";
import { ChannelTypes, DiscordChannel } from "../mod.ts";

export abstract class Channel implements Model {
    constructor(session: Session, data: DiscordChannel) {
        this.id = data.id;
        this.session = session;
        this.name = data.name;
        this.type = data.type;
    }
    readonly id: Snowflake;
    readonly session: Session;
    name?: string;
    type: ChannelTypes;

    toString(): string {
        return `<#${this.id}>`;
    }
}

export default Channel;
