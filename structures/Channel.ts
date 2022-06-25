import type { Model } from "./Base.ts";
import { ChannelTypes, DiscordChannel, Session, Snowflake } from "../mod.ts";

export abstract class Channel implements Model {
    constructor(session: Session, data: DiscordChannel) {
        this.id = data.id;
        this.session = session;
        this.name = data.name;
        this.type = data.type;
    }
    readonly id: Snowflake;
    readonly session: Session;
    readonly name: string | undefined;
    readonly type: ChannelTypes;
}
