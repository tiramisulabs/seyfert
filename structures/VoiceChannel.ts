import { GuildChannel } from "./GuildChannel.ts";
import { Guild } from "./Guild.ts";
import { DiscordChannel, Session, Snowflake, VideoQualityModes } from "../mod.ts";

export class VoiceChannel extends GuildChannel {
    constructor(session: Session, data: DiscordChannel, guildId: Guild["id"]) {
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
    nsfw?: boolean;
}