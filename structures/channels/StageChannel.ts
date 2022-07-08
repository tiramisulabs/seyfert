import type { Snowflake } from "../../util/Snowflake.ts";
import type { Session } from "../../session/Session.ts";
import type { ChannelTypes, DiscordChannel } from "../../vendor/external.ts";
import BaseVoiceChannel from "./BaseVoiceChannel.ts";

export class StageChannel extends BaseVoiceChannel {
    constructor(session: Session, data: DiscordChannel, guildId: Snowflake) {
        super(session, data, guildId);
        this.type = data.type as number;
        this.topic = data.topic ? data.topic : undefined;
    }
    override type: ChannelTypes.GuildStageVoice;
    topic?: string;
}

export default StageChannel;
