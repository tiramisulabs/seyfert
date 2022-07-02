import type { Snowflake } from "../util/Snowflake.ts";
import type { Session } from "../session/Session.ts";
import type { DiscordChannel, VideoQualityModes } from "../vendor/external.ts";
import { GatewayOpcodes } from "../vendor/external.ts";
import { calculateShardId } from "../vendor/gateway/calculateShardId.ts";
import GuildChannel from "./GuildChannel.ts";

/**
 * @link https://discord.com/developers/docs/topics/gateway#update-voice-state
 */
export interface UpdateVoiceState {
    guildId: string;
    channelId?: string;
    selfMute: boolean;
    selfDeaf: boolean;
}

export class VoiceChannel extends GuildChannel {
    constructor(session: Session, data: DiscordChannel, guildId: Snowflake) {
        super(session, data, guildId);
        this.bitRate = data.bitrate;
        this.userLimit = data.user_limit ?? 0;
        this.videoQuality = data.video_quality_mode;
        this.nsfw = !!data.nsfw;

        if (data.rtc_region) {
            this.rtcRegion = data.rtc_region;
        }
    }
    bitRate?: number;
    userLimit: number;
    rtcRegion?: Snowflake;

    videoQuality?: VideoQualityModes;
    nsfw: boolean;

    /**
     * This function was gathered from Discordeno it may not work
     */
    async connect(options?: UpdateVoiceState) {
        const shardId = calculateShardId(this.session.gateway, BigInt(super.guildId));
        const shard = this.session.gateway.manager.shards.get(shardId);

        if (!shard) {
            throw new Error(`Shard (id: ${shardId} not found`);
        }

        await shard.send({
            op: GatewayOpcodes.VoiceStateUpdate,
            d: {
                guild_id: super.guildId,
                channel_id: super.id,
                self_mute: Boolean(options?.selfMute),
                self_deaf: options?.selfDeaf ?? true,
            },
        });
    }
}

export default VoiceChannel;
