import type { Session } from "../session/Session.ts";
import type { DiscordChannel } from "../vendor/external.ts";
import { ChannelTypes } from "../vendor/external.ts";
import { textBasedChannels } from "./TextChannel.ts";
import TextChannel from "./TextChannel.ts";
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

export class ChannelFactory {
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
                    return new TextChannel(session, channel);
                }
                throw new Error("Channel was not implemented");
        }
    }
}

export default ChannelFactory;
