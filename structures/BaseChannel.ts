import type { Model } from "./Base.ts";
import type { Snowflake } from "../util/Snowflake.ts";
import type { Session } from "../session/Session.ts";
import type { DiscordChannel } from "../vendor/external.ts";
import type TextChannel from "./TextChannel.ts";
import type VoiceChannel from "./VoiceChannel.ts";
import type DMChannel from "./DMChannel.ts";
import type NewsChannel from "./NewsChannel.ts";
import type ThreadChannel from "./ThreadChannel.ts";
import { ChannelTypes } from "../vendor/external.ts";
import { textBasedChannels } from "./TextChannel.ts";

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
        return textBasedChannels.includes(this.type);
    }

    isVoice(): this is VoiceChannel {
        return this.type === ChannelTypes.GuildVoice;
    }

    isDM(): this is DMChannel {
        return this.type === ChannelTypes.DM;
    }

    isNews(): this is NewsChannel {
        return this.type === ChannelTypes.GuildNews;
    }

    isThread(): this is ThreadChannel {
        return this.type === ChannelTypes.GuildPublicThread || this.type === ChannelTypes.GuildPrivateThread;
    }

    toString(): string {
        return `<#${this.id}>`;
    }
}

export default BaseChannel;
