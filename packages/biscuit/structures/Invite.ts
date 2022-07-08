import type { Session } from "../Session.ts";
import type { Snowflake } from "../Snowflake.ts";
import type {
    DiscordChannel,
    DiscordInvite,
    DiscordMemberWithUser,
    DiscordScheduledEventEntityMetadata,
    ScheduledEventEntityType,
    ScheduledEventPrivacyLevel,
    ScheduledEventStatus,
} from "../../discordeno/mod.ts";
import { TargetTypes } from "../../discordeno/mod.ts";
import { GuildChannel } from "./channels.ts";
import { Member } from "./Member.ts";
import InviteGuild from "./guilds/InviteGuild.ts";
import User from "./User.ts";
import Guild from "./guilds/Guild.ts";

export interface InviteStageInstance {
    /** The members speaking in the Stage */
    members: Partial<Member>[];
    /** The number of users in the Stage */
    participantCount: number;
    /** The number of users speaking in the Stage */
    speakerCount: number;
    /** The topic of the Stage instance (1-120 characters) */
    topic: string;
}

export interface InviteScheduledEvent {
    id: Snowflake;
    guildId: string;
    channelId?: string;
    creatorId?: string;
    name: string;
    description?: string;
    scheduledStartTime: string;
    scheduledEndTime?: string;
    privacyLevel: ScheduledEventPrivacyLevel;
    status: ScheduledEventStatus;
    entityType: ScheduledEventEntityType;
    entityId?: string;
    entityMetadata?: DiscordScheduledEventEntityMetadata;
    creator?: User;
    userCount?: number;
    image?: string;
}

/**
 * @link https://discord.com/developers/docs/resources/invite#invite-object
 */
export class Invite {
    constructor(session: Session, data: DiscordInvite) {
        this.session = session;

        if (data.guild) {
            this.guild = new InviteGuild(session, data.guild);
        }

        if (data.approximate_member_count) {
            this.approximateMemberCount = data.approximate_member_count;
        }

        if (data.approximate_presence_count) {
            this.approximatePresenceCount = data.approximate_presence_count;
        }

        if (data.channel) {
            const guildId = (data.guild && data.guild?.id) ? data.guild.id : "";
            this.channel = new GuildChannel(session, data.channel as DiscordChannel, guildId);
        }

        this.code = data.code;

        if (data.expires_at) {
            this.expiresAt = Number.parseInt(data.expires_at);
        }

        if (data.guild_scheduled_event) {
            this.guildScheduledEvent = {
                id: data.guild_scheduled_event.id,
                guildId: data.guild_scheduled_event.guild_id,
                channelId: data.guild_scheduled_event.channel_id ? data.guild_scheduled_event.channel_id : undefined,
                creatorId: data.guild_scheduled_event.creator_id ? data.guild_scheduled_event.creator_id : undefined,
                name: data.guild_scheduled_event.name,
                description: data.guild_scheduled_event.description
                    ? data.guild_scheduled_event.description
                    : undefined,
                scheduledStartTime: data.guild_scheduled_event.scheduled_start_time,
                scheduledEndTime: data.guild_scheduled_event.scheduled_end_time
                    ? data.guild_scheduled_event.scheduled_end_time
                    : undefined,
                privacyLevel: data.guild_scheduled_event.privacy_level,
                status: data.guild_scheduled_event.status,
                entityType: data.guild_scheduled_event.entity_type,
                entityId: data.guild ? data.guild.id : undefined,
                entityMetadata: data.guild_scheduled_event.entity_metadata
                    ? data.guild_scheduled_event.entity_metadata
                    : undefined,
                creator: data.guild_scheduled_event.creator
                    ? new User(session, data.guild_scheduled_event.creator)
                    : undefined,
                userCount: data.guild_scheduled_event.user_count ? data.guild_scheduled_event.user_count : undefined,
                image: data.guild_scheduled_event.image ? data.guild_scheduled_event.image : undefined,
            };
        }

        if (data.inviter) {
            this.inviter = new User(session, data.inviter);
        }

        if (data.target_user) {
            this.targetUser = new User(session, data.target_user);
        }

        if (data.stage_instance) {
            const guildId = (data.guild && data.guild?.id) ? data.guild.id : "";
            this.stageInstance = {
                members: data.stage_instance.members.map((m) =>
                    new Member(session, m as DiscordMemberWithUser, guildId)
                ),
                participantCount: data.stage_instance.participant_count,
                speakerCount: data.stage_instance.speaker_count,
                topic: data.stage_instance.topic,
            };
        }

        // TODO: create Application structure
        // this.targetApplication = data.target_application

        if (data.target_type) {
            this.targetType = data.target_type;
        }
    }

    readonly session: Session;
    guild?: InviteGuild;
    approximateMemberCount?: number;
    approximatePresenceCount?: number;
    code: string;
    expiresAt?: number;
    inviter?: User;
    targetUser?: User;
    targetType?: TargetTypes;
    channel?: Partial<GuildChannel>;
    stageInstance?: InviteStageInstance;
    guildScheduledEvent?: InviteScheduledEvent;
    // TODO: create Application structure
    // targetApplication?: Partial<Application>

    async delete(): Promise<Invite> {
        await Guild.prototype.deleteInvite.call(this.guild, this.code);
        return this;
    }
}

export default Invite;
