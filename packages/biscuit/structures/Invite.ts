import type { Session } from "../Session.ts";
import type { Snowflake } from "../Snowflake.ts";
import type {
    DiscordApplication,
    DiscordChannel,
    DiscordInvite,
    DiscordInviteCreate,
    DiscordMemberWithUser,
    DiscordScheduledEventEntityMetadata,
    ScheduledEventEntityType,
    ScheduledEventPrivacyLevel,
    ScheduledEventStatus,
} from "../../discordeno/mod.ts";
import { TargetTypes } from "../../discordeno/mod.ts";
import { GuildChannel } from "./channels.ts";
import { Member } from "./Member.ts";
import { Guild, InviteGuild } from "./guilds.ts";
import User from "./User.ts";
import Application from "./Application.ts";

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

export interface InviteCreate {
    channelId: string;
    code: string;
    createdAt: string;
    guildId?: string;
    inviter?: User;
    maxAge: number;
    maxUses: number;
    targetType: TargetTypes;
    targetUser?: User;
    targetApplication?: Partial<Application>;
    temporary: boolean;
    uses: number;
}

export function NewInviteCreate(session: Session, invite: DiscordInviteCreate): InviteCreate {
    return {
        channelId: invite.channel_id,
        code: invite.code,
        createdAt: invite.created_at,
        guildId: invite.guild_id,
        inviter: invite.inviter ? new User(session, invite.inviter) : undefined,
        maxAge: invite.max_age,
        maxUses: invite.max_uses,
        targetType: invite.target_type,
        targetUser: invite.target_user ? new User(session, invite.target_user) : undefined,
        targetApplication: invite.target_application
            ? new Application(session, invite.target_application as DiscordApplication)
            : undefined,
        temporary: invite.temporary,
        uses: invite.uses,
    };
}

/**
 * @link https://discord.com/developers/docs/resources/invite#invite-object
 */
export class Invite {
    constructor(session: Session, data: DiscordInvite) {
        this.session = session;

        this.guild = data.guild ? new InviteGuild(session, data.guild) : undefined;
        this.approximateMemberCount = data.approximate_member_count ? data.approximate_member_count : undefined;
        this.approximatePresenceCount = data.approximate_presence_count ? data.approximate_presence_count : undefined;
        this.code = data.code;
        this.expiresAt = data.expires_at ? Number.parseInt(data.expires_at) : undefined;
        this.inviter = data.inviter ? new User(session, data.inviter) : undefined;
        this.targetUser = data.target_user ? new User(session, data.target_user) : undefined;
        this.targetApplication = data.target_application
            ? new Application(session, data.target_application as DiscordApplication)
            : undefined;
        this.targetType = data.target_type;

        if (data.channel) {
            const guildId = (data.guild && data.guild?.id) ? data.guild.id : "";
            this.channel = new GuildChannel(session, data.channel as DiscordChannel, guildId);
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
    targetApplication?: Partial<Application>;

    async delete(): Promise<Invite> {
        await Guild.prototype.deleteInvite.call(this.guild, this.code);
        return this;
    }
}

export default Invite;
