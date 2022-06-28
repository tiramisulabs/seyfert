import type { Snowflake } from "../util/Snowflake.ts";
import type { Session } from "../session/Session.ts";
import type { DiscordChannel, VideoQualityModes } from "../vendor/external.ts";
import GuildChannel from "./GuildChannel.ts";

export class VoiceChannel extends GuildChannel {
    constructor(session: Session, guildId: Snowflake, data: DiscordChannel) {
        super(session, data, guildId);
        this.bitRate = data.bitrate;
        this.userLimit = data.user_limit ?? 0;
        data.rtc_region ? this.rtcRegion = data.rtc_region : undefined;
        this.videoQuality = data.video_quality_mode;
        this.nsfw = !!data.nsfw;
    }
    bitRate?: number;
    userLimit: number;
    rtcRegion?: Snowflake;

    videoQuality?: VideoQualityModes;
    nsfw: boolean;
}

export default VoiceChannel;
