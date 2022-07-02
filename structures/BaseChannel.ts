import type { Model } from "./Base.ts";
import type { Snowflake } from "../util/Snowflake.ts";
import type { Session } from "../session/Session.ts";
import type { DiscordChannel } from "../vendor/external.ts";
import { ChannelTypes } from "../vendor/external.ts";
import TextChannel, { textBasedChannels } from "./TextChannel.ts";
import VoiceChannel from "./VoiceChannel.ts";
import DMChannel from "./DMChannel.ts";
import NewsChannel from "./NewsChannel.ts";
import ThreadChannel from "./ThreadChannel.ts";

export type Channel =
    | TextChannel
    | VoiceChannel
    | DMChannel
    | NewsChannel
    | ThreadChannel;

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

    static from(session: Session, channel: DiscordChannel): Channel {
        switch (channel.type) {
            case ChannelTypes.GuildPublicThread:
            case ChannelTypes.GuildPrivateThread:
                return new ThreadChannel(session, channel, channel.guild_id!);
            case ChannelTypes.GuildNews:
                return new NewsChannel(session, channel, channel.guild_id!);
            case ChannelTypes.DM:
                return new DMChannel(session, channel);
            case ChannelTypes.GuildVoice:
                return new VoiceChannel(session, channel, channel.guild_id!);
            default:
                if (textBasedChannels.includes(channel.type)) {
                    return new TextChannel(session, channel, channel.guild_id!);
                }
                throw new Error("Channel was not implemented");
        }
    }

    toString(): string {
        return `<#${this.id}>`;
    }
}

export default BaseChannel;
