import type { Model } from "./Base.ts";
import type { Snowflake } from "../util/Snowflake.ts";
import type { Session } from "../session/Session.ts";
import type { ChannelTypes, DiscordChannel } from "../vendor/external.ts";
import TextChannel from "./TextChannel.ts";
import VoiceChannel from "./VoiceChannel.ts";
import DMChannel from "./DMChannel.ts";
import NewsChannel from "./NewsChannel.ts";
import ThreadChannel from "./ThreadChannel.ts";

export abstract class BaseChannel implements Model {
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

    isText(): this is TextChannel {
        return this instanceof TextChannel;
    }

    isVoice(): this is VoiceChannel {
        return this instanceof VoiceChannel;
    }

    isDM(): this is DMChannel {
        return this instanceof DMChannel;
    }

    isNews(): this is NewsChannel {
        return this instanceof NewsChannel;
    }

    isThread(): this is ThreadChannel {
        return this instanceof ThreadChannel;
    }

    toString(): string {
        return `<#${this.id}>`;
    }
}

export default BaseChannel;
