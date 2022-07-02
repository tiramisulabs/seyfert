import type { Snowflake } from "../util/Snowflake.ts";
import type { Session } from "../session/Session.ts";
import type { ChannelTypes, DiscordChannel } from "../vendor/external.ts";
import GuildChannel from "./GuildChannel.ts";
import Message from "./Message.ts";

export class NewsChannel extends GuildChannel {
    constructor(session: Session, data: DiscordChannel, guildId: Snowflake) {
        super(session, data, guildId);
        this.type = data.type as ChannelTypes.GuildNews;
        this.defaultAutoArchiveDuration = data.default_auto_archive_duration;
    }

    override type: ChannelTypes.GuildNews;
    defaultAutoArchiveDuration?: number;

    crosspostMessage(messageId: Snowflake): Promise<Message> {
        return Message.prototype.crosspost.call({ id: messageId, channelId: this.id, session: this.session });
    }

    get publishMessage() {
        return this.crosspostMessage;
    }
}

export default NewsChannel;
