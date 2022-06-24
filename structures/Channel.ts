import type { Model } from "./Base.ts";
import { Snowflake, Session, DiscordChannel, ChannelTypes } from "../mod.ts"; 

export class Channel implements Model {
    constructor(session: Session, data: DiscordChannel) {
        this.id = data.id;
        this.data = data;
        this.session = session;
        this.name = this.data.name;
    }
    readonly data: DiscordChannel;
    readonly id: Snowflake;
    readonly session: Session;
    public readonly name: string | undefined;

    get type() {
        return ChannelTypes[this.data.type];
    }

}