import type { Model } from "./Base.ts";
import type { Session } from "../Session.ts";
import type { ChannelTypes, DefaultMessageNotificationLevels, DiscordEmoji, DiscordGuild, DiscordInviteMetadata, DiscordListActiveThreads, DiscordMemberWithUser, DiscordOverwrite, DiscordRole, ExplicitContentFilterLevels, GuildNsfwLevel, MakeRequired, SystemChannelFlags, VerificationLevels, VideoQualityModes } from "../../discordeno/mod.ts";
import type { ImageFormat, ImageSize } from "../Util.ts";
import { GuildFeatures } from "../../discordeno/mod.ts";
import { Snowflake } from "../Snowflake.ts";
import Util from "../Util.ts";
import * as Routes from "../Routes.ts";
import WelcomeScreen from "./WelcomeScreen.ts";
import { GuildChannel, ThreadChannel } from "./channels.ts";
import ThreadMember from "./ThreadMember.ts";
import Member from "./Member.ts";
import Role from "./Role.ts";
import GuildEmoji from "./GuildEmoji.ts";
import { urlToBase64 } from "../util/urlToBase64.ts";
import Invite from "./Invite.ts";

/** BaseGuild */
/**
 * Class for {@link Guild} and {@link AnonymousGuild}
 */
export abstract class BaseGuild implements Model {
    constructor(session: Session, data: DiscordGuild) {
        this.session = session;
        this.id = data.id;

        this.name = data.name;
        this.iconHash = data.icon ? Util.iconHashToBigInt(data.icon) : undefined;

        this.features = data.features;
    }

    readonly session: Session;
    readonly id: Snowflake;

    name: string;
    iconHash?: bigint;
    features: GuildFeatures[];

    get createdTimestamp() {
        return Snowflake.snowflakeToTimestamp(this.id);
    }

    get createdAt() {
        return new Date(this.createdTimestamp);
    }

    get partnered() {
        return this.features.includes(GuildFeatures.Partnered);
    }

    get verified() {
        return this.features.includes(GuildFeatures.Verified);
    }

    iconURL(options: { size?: ImageSize; format?: ImageFormat } = { size: 128 }) {
        if (this.iconHash) {
            return Util.formatImageURL(
                Routes.GUILD_ICON(this.id, Util.iconBigintToHash(this.iconHash)),
                options.size,
                options.format,
            );
        }
    }

    toString() {
        return this.name;
    }
}

/** AnonymousGuild */
export class AnonymousGuild extends BaseGuild implements Model {
    constructor(session: Session, data: Partial<DiscordGuild>); // TODO: Improve this type (name and id are required)
    constructor(session: Session, data: DiscordGuild) {
        super(session, data);

        this.splashHash = data.splash ? Util.iconHashToBigInt(data.splash) : undefined;
        this.bannerHash = data.banner ? Util.iconHashToBigInt(data.banner) : undefined;

        this.verificationLevel = data.verification_level;
        this.vanityUrlCode = data.vanity_url_code ? data.vanity_url_code : undefined;
        this.nsfwLevel = data.nsfw_level;
        this.description = data.description ? data.description : undefined;
        this.premiumSubscriptionCount = data.premium_subscription_count;
    }

    splashHash?: bigint;
    bannerHash?: bigint;

    verificationLevel: VerificationLevels;
    vanityUrlCode?: string;
    nsfwLevel: GuildNsfwLevel;
    description?: string;
    premiumSubscriptionCount?: number;

    splashURL(options: { size?: ImageSize; format?: ImageFormat } = { size: 128 }) {
        if (this.splashHash) {
            return Util.formatImageURL(
                Routes.GUILD_SPLASH(this.id, Util.iconBigintToHash(this.splashHash)),
                options.size,
                options.format,
            );
        }
    }

    bannerURL(options: { size?: ImageSize; format?: ImageFormat } = { size: 128 }) {
        if (this.bannerHash) {
            return Util.formatImageURL(
                Routes.GUILD_BANNER(this.id, Util.iconBigintToHash(this.bannerHash)),
                options.size,
                options.format,
            );
        }
    }
}

/** InviteGuild */
export class InviteGuild extends AnonymousGuild implements Model {
    constructor(session: Session, data: Partial<DiscordGuild>) {
        super(session, data);

        if (data.welcome_screen) {
            this.welcomeScreen = new WelcomeScreen(session, data.welcome_screen);
        }
    }

    welcomeScreen?: WelcomeScreen;
}

/** Guild */
export interface CreateRole {
    name?: string;
    color?: number;
    iconHash?: string | bigint;
    unicodeEmoji?: string;
    hoist?: boolean;
    mentionable?: boolean;
}

export interface ModifyGuildRole {
    name?: string;
    color?: number;
    hoist?: boolean;
    mentionable?: boolean;
    unicodeEmoji?: string;
}

export interface CreateGuildEmoji {
    name: string;
    image: string;
    roles?: Snowflake[];
    reason?: string;
}

export interface ModifyGuildEmoji {
    name?: string;
    roles?: Snowflake[];
}

/**
 * @link https://discord.com/developers/docs/resources/guild#create-guild-ban
 */
export interface CreateGuildBan {
    deleteMessageDays?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
    reason?: string;
}

/**
 * @link https://discord.com/developers/docs/resources/guild#modify-guild-member
 */
export interface ModifyGuildMember {
    nick?: string;
    roles?: Snowflake[];
    mute?: boolean;
    deaf?: boolean;
    channelId?: Snowflake;
    communicationDisabledUntil?: number;
}

/**
 * @link https://discord.com/developers/docs/resources/guild#begin-guild-prune
 */
export interface BeginGuildPrune {
    days?: number;
    computePruneCount?: boolean;
    includeRoles?: Snowflake[];
}

export interface ModifyRolePositions {
    id: Snowflake;
    position?: number | null;
}

export interface GuildCreateOptionsRole {
    id: Snowflake;
    name?: string;
    color?: number;
    hoist?: boolean;
    position?: number;
    permissions?: bigint;
    mentionable?: boolean;
    iconURL?: string;
    unicodeEmoji?: string | null;
}

export interface GuildCreateOptionsRole {
    id: Snowflake;
    name?: string;
    color?: number;
    hoist?: boolean;
    position?: number;
    permissions?: bigint;
    mentionable?: boolean;
    iconHash?: bigint;
    unicodeEmoji?: string | null;
}

export interface GuildCreateOptionsChannel {
    id?: Snowflake;
    parentId?: Snowflake;
    type?: ChannelTypes.GuildText | ChannelTypes.GuildVoice | ChannelTypes.GuildCategory;
    name: string;
    topic?: string | null;
    nsfw?: boolean;
    bitrate?: number;
    userLimit?: number;
    rtcRegion?: string | null;
    videoQualityMode?: VideoQualityModes;
    permissionOverwrites?: MakeRequired<Partial<DiscordOverwrite>, "id">[];
    rateLimitPerUser?: number;
}

/**
 * @link https://discord.com/developers/docs/resources/guild#create-guild
 */
export interface GuildCreateOptions {
    name: string;
    afkChannelId?: Snowflake;
    afkTimeout?: number;
    channels?: GuildCreateOptionsChannel[];
    defaultMessageNotifications?: DefaultMessageNotificationLevels;
    explicitContentFilter?: ExplicitContentFilterLevels;
    iconURL?: string;
    roles?: GuildCreateOptionsRole[];
    systemChannelFlags?: SystemChannelFlags;
    systemChannelId?: Snowflake;
    verificationLevel?: VerificationLevels;
}

export interface GuildCreateOptions {
    name: string;
    afkChannelId?: Snowflake;
    afkTimeout?: number;
    channels?: GuildCreateOptionsChannel[];
    defaultMessageNotifications?: DefaultMessageNotificationLevels;
    explicitContentFilter?: ExplicitContentFilterLevels;
    iconHash?: bigint;
    roles?: GuildCreateOptionsRole[];
    systemChannelFlags?: SystemChannelFlags;
    systemChannelId?: Snowflake;
    verificationLevel?: VerificationLevels;
}

/**
 * @link https://discord.com/developers/docs/resources/guild#modify-guild-json-params
 */
export interface GuildEditOptions extends Omit<GuildCreateOptions, "roles" | "channels"> {
    ownerId?: Snowflake;
    splashURL?: string;
    bannerURL?: string;
    discoverySplashURL?: string;
    features?: GuildFeatures[];
    rulesChannelId?: Snowflake;
    description?: string;
    premiumProgressBarEnabled?: boolean;
}

export interface GuildEditOptions extends Omit<GuildCreateOptions, "roles" | "channels"> {
    ownerId?: Snowflake;
    splashHash?: bigint;
    bannerHash?: bigint;
    discoverySplashHash?: bigint;
    features?: GuildFeatures[];
    rulesChannelId?: Snowflake;
    publicUpdatesChannelId?: Snowflake;
    preferredLocale?: string | null;
    description?: string;
    premiumProgressBarEnabled?: boolean;
}

/**
 * Represents a guild
 * @link https://discord.com/developers/docs/resources/guild#guild-object
 */
export class Guild extends BaseGuild implements Model {
    constructor(session: Session, data: DiscordGuild) {
        super(session, data);

        this.splashHash = data.splash ? Util.iconHashToBigInt(data.splash) : undefined;
        this.discoverySplashHash = data.discovery_splash ? Util.iconHashToBigInt(data.discovery_splash) : undefined;
        this.ownerId = data.owner_id;
        this.widgetEnabled = !!data.widget_enabled;
        this.widgetChannelId = data.widget_channel_id ? data.widget_channel_id : undefined;
        this.vefificationLevel = data.verification_level;
        this.defaultMessageNotificationLevel = data.default_message_notifications;
        this.explicitContentFilterLevel = data.explicit_content_filter;

        this.members = new Map(
            data.members?.map((member) => [data.id, new Member(session, { ...member, user: member.user! }, data.id)]),
        );

        this.roles = new Map(
            data.roles.map((role) => [data.id, new Role(session, role, data.id)]),
        );

        this.emojis = new Map(
            data.emojis.map((guildEmoji) => [guildEmoji.id!, new GuildEmoji(session, guildEmoji, data.id)]),
        );

        this.channels = new Map(
            data.channels?.map((guildChannel) => [guildChannel.id, new GuildChannel(session, guildChannel, data.id)]),
        );
    }

    splashHash?: bigint;
    discoverySplashHash?: bigint;
    ownerId: Snowflake;
    widgetEnabled: boolean;
    widgetChannelId?: Snowflake;
    vefificationLevel: VerificationLevels;
    defaultMessageNotificationLevel: DefaultMessageNotificationLevels;
    explicitContentFilterLevel: ExplicitContentFilterLevels;
    members: Map<Snowflake, Member>;
    roles: Map<Snowflake, Role>;
    emojis: Map<Snowflake, GuildEmoji>;
    channels: Map<Snowflake, GuildChannel>;

    /**
     * 'null' would reset the nickname
     */
    async editBotNickname(options: { nick: string | null; reason?: string }) {
        const result = await this.session.rest.runMethod<{ nick?: string } | undefined>(
            this.session.rest,
            "PATCH",
            Routes.USER_NICK(this.id),
            options,
        );

        return result?.nick;
    }

    async createEmoji(options: CreateGuildEmoji): Promise<GuildEmoji> {
        if (options.image && !options.image.startsWith("data:image/")) {
            options.image = await urlToBase64(options.image);
        }

        const emoji = await this.session.rest.runMethod<DiscordEmoji>(
            this.session.rest,
            "POST",
            Routes.GUILD_EMOJIS(this.id),
            options,
        );

        return new GuildEmoji(this.session, emoji, this.id);
    }

    async deleteEmoji(id: Snowflake, { reason }: { reason?: string } = {}): Promise<void> {
        await this.session.rest.runMethod<undefined>(
            this.session.rest,
            "DELETE",
            Routes.GUILD_EMOJI(this.id, id),
            { reason },
        );
    }

    async editEmoji(id: Snowflake, options: ModifyGuildEmoji): Promise<GuildEmoji> {
        const emoji = await this.session.rest.runMethod<DiscordEmoji>(
            this.session.rest,
            "PATCH",
            Routes.GUILD_EMOJI(this.id, id),
            options,
        );

        return new GuildEmoji(this.session, emoji, this.id);
    }

    async createRole(options: CreateRole): Promise<Role> {
        let icon: string | undefined;

        if (options.iconHash) {
            if (typeof options.iconHash === "string") {
                icon = options.iconHash;
            } else {
                icon = Util.iconBigintToHash(options.iconHash);
            }
        }

        const role = await this.session.rest.runMethod<DiscordRole>(
            this.session.rest,
            "PUT",
            Routes.GUILD_ROLES(this.id),
            {
                name: options.name,
                color: options.color,
                icon,
                unicode_emoji: options.unicodeEmoji,
                hoist: options.hoist,
                mentionable: options.mentionable,
            },
        );

        return new Role(this.session, role, this.id);
    }

    async deleteRole(roleId: Snowflake): Promise<void> {
        await this.session.rest.runMethod<undefined>(this.session.rest, "DELETE", Routes.GUILD_ROLE(this.id, roleId));
    }

    async editRole(roleId: Snowflake, options: ModifyGuildRole): Promise<Role> {
        const role = await this.session.rest.runMethod<DiscordRole>(
            this.session.rest,
            "PATCH",
            Routes.GUILD_ROLE(this.id, roleId),
            {
                name: options.name,
                color: options.color,
                hoist: options.hoist,
                mentionable: options.mentionable,
            },
        );

        return new Role(this.session, role, this.id);
    }

    async addRole(memberId: Snowflake, roleId: Snowflake, { reason }: { reason?: string } = {}) {
        await this.session.rest.runMethod<undefined>(
            this.session.rest,
            "PUT",
            Routes.GUILD_MEMBER_ROLE(this.id, memberId, roleId),
            { reason },
        );
    }

    async removeRole(memberId: Snowflake, roleId: Snowflake, { reason }: { reason?: string } = {}) {
        await this.session.rest.runMethod<undefined>(
            this.session.rest,
            "DELETE",
            Routes.GUILD_MEMBER_ROLE(this.id, memberId, roleId),
            { reason },
        );
    }

    /**
     * Returns the roles moved
     */
    async moveRoles(options: ModifyRolePositions[]) {
        const roles = await this.session.rest.runMethod<DiscordRole[]>(
            this.session.rest,
            "PATCH",
            Routes.GUILD_ROLES(this.id),
            options,
        );

        return roles.map((role) => new Role(this.session, role, this.id));
    }

    async deleteInvite(inviteCode: string): Promise<void> {
        await this.session.rest.runMethod<undefined>(
            this.session.rest,
            "DELETE",
            Routes.INVITE(inviteCode),
            {},
        );
    }

    async fetchInvite(inviteCode: string, options: Routes.GetInvite): Promise<Invite> {
        const inviteMetadata = await this.session.rest.runMethod<DiscordInviteMetadata>(
            this.session.rest,
            "GET",
            Routes.INVITE(inviteCode, options),
        );

        return new Invite(this.session, inviteMetadata);
    }

    async fetchInvites(): Promise<Invite[]> {
        const invites = await this.session.rest.runMethod<DiscordInviteMetadata[]>(
            this.session.rest,
            "GET",
            Routes.GUILD_INVITES(this.id),
        );

        return invites.map((invite) => new Invite(this.session, invite));
    }

    /**
     * Bans the member
     */
    async banMember(memberId: Snowflake, options: CreateGuildBan) {
        await this.session.rest.runMethod<undefined>(
            this.session.rest,
            "PUT",
            Routes.GUILD_BAN(this.id, memberId),
            options
                ? {
                    delete_message_days: options.deleteMessageDays,
                    reason: options.reason,
                }
                : {},
        );
    }

    /**
     * Kicks the member
     */
    async kickMember(memberId: Snowflake, { reason }: { reason?: string }) {
        await this.session.rest.runMethod<undefined>(
            this.session.rest,
            "DELETE",
            Routes.GUILD_MEMBER(this.id, memberId),
            { reason },
        );
    }

    /*
     * Unbans the member
     * */
    async unbanMember(memberId: Snowflake) {
        await this.session.rest.runMethod<undefined>(
            this.session.rest,
            "DELETE",
            Routes.GUILD_BAN(this.id, memberId),
        );
    }

    async editMember(memberId: Snowflake, options: ModifyGuildMember) {
        const member = await this.session.rest.runMethod<DiscordMemberWithUser>(
            this.session.rest,
            "PATCH",
            Routes.GUILD_MEMBER(this.id, memberId),
            {
                nick: options.nick,
                roles: options.roles,
                mute: options.mute,
                deaf: options.deaf,
                channel_id: options.channelId,
                communication_disabled_until: options.communicationDisabledUntil
                    ? new Date(options.communicationDisabledUntil).toISOString()
                    : undefined,
            },
        );

        return new Member(this.session, member, this.id);
    }

    async pruneMembers(options: BeginGuildPrune): Promise<number> {
        const result = await this.session.rest.runMethod<{ pruned: number }>(
            this.session.rest,
            "POST",
            Routes.GUILD_PRUNE(this.id),
            {
                days: options.days,
                compute_prune_count: options.computePruneCount,
                include_roles: options.includeRoles,
            },
        );

        return result.pruned;
    }

    async getPruneCount(): Promise<number> {
        const result = await this.session.rest.runMethod<{ pruned: number }>(
            this.session.rest,
            "GET",
            Routes.GUILD_PRUNE(this.id),
        );

        return result.pruned;
    }

    async getActiveThreads() {
        const { threads, members } = await this.session.rest.runMethod<DiscordListActiveThreads>(
            this.session.rest,
            "GET",
            Routes.THREAD_ACTIVE(this.id),
        );

        return {
            threads: Object.fromEntries(
                threads.map((thread) => [thread.id, new ThreadChannel(this.session, thread, this.id)]),
            ) as Record<Snowflake, ThreadChannel>,
            members: Object.fromEntries(
                members.map((threadMember) => [threadMember.id, new ThreadMember(this.session, threadMember)]),
            ) as Record<Snowflake, ThreadMember>,
        };
    }

    /** *
     * Makes the bot leave the guild
     */
    async leave() {
    }

    /** *
     * Deletes a guild
     */
    async delete() {
        await this.session.rest.runMethod<undefined>(
            this.session.rest,
            "DELETE",
            Routes.GUILDS(),
        );
    }

    /**
     * Creates a guild and returns its data, the bot joins the guild
     * This was modified from discord.js to make it compatible
     * precondition: Bot should be in less than 10 servers
     */
    static async create(session: Session, options: GuildCreateOptions) {
        const guild = await session.rest.runMethod<DiscordGuild>(session.rest, "POST", Routes.GUILDS(), {
            name: options.name,
            afk_channel_id: options.afkChannelId,
            afk_timeout: options.afkTimeout,
            default_message_notifications: options.defaultMessageNotifications,
            explicit_content_filter: options.explicitContentFilter,
            system_channel_flags: options.systemChannelFlags,
            verification_level: options.verificationLevel,
            icon: "iconURL" in options
                ? options.iconURL || urlToBase64(options.iconURL!)
                : options.iconHash || Util.iconBigintToHash(options.iconHash!),
            channels: options.channels?.map((channel) => ({
                name: channel.name,
                nsfw: channel.nsfw,
                id: channel.id,
                bitrate: channel.bitrate,
                parent_id: channel.parentId,
                permission_overwrites: channel.permissionOverwrites,
                rtc_region: channel.rtcRegion,
                user_limit: channel.userLimit,
                video_quality_mode: channel.videoQualityMode,
                rate_limit_per_user: channel.rateLimitPerUser,
            })),
            roles: options.roles?.map((role) => ({
                name: role.name,
                id: role.id,
                color: role.color,
                mentionable: role.mentionable,
                hoist: role.hoist,
                position: role.position,
                unicode_emoji: role.unicodeEmoji,
                icon: options.iconURL || urlToBase64(options.iconURL!),
            })),
        });

        return new Guild(session, guild);
    }

    /**
     * Edits a guild and returns its data
     */
    async edit(session: Session, options: GuildEditOptions) {
        const guild = await session.rest.runMethod<DiscordGuild>(session.rest, "PATCH", Routes.GUILDS(), {
            name: options.name,
            afk_channel_id: options.afkChannelId,
            afk_timeout: options.afkTimeout,
            default_message_notifications: options.defaultMessageNotifications,
            explicit_content_filter: options.explicitContentFilter,
            system_channel_flags: options.systemChannelFlags,
            verification_level: options.verificationLevel,
            icon: "iconURL" in options
                ? options.iconURL || urlToBase64(options.iconURL!)
                : options.iconHash || Util.iconBigintToHash(options.iconHash!),
            // extra props
            splash: "splashURL" in options
                ? options.splashURL || urlToBase64(options.splashURL!)
                : options.splashHash || Util.iconBigintToHash(options.iconHash!),
            banner: "bannerURL" in options ? options.bannerURL || urlToBase64(options.bannerURL!)
            : options.bannerHash || Util.iconBigintToHash(options.bannerHash!),
            discovery_splash: "discoverySplashURL" in options
                ? options.discoverySplashURL || urlToBase64(options.discoverySplashURL!)
                : options.discoverySplashHash || Util.iconBigintToHash(options.discoverySplashHash!),
            owner_id: options.ownerId,
            rules_channel_id: options.rulesChannelId,
            public_updates_channel_id: options.publicUpdatesChannelId,
            preferred_locale: options.preferredLocale,
            features: options.features,
            description: options.description,
            premiumProgressBarEnabled: options.premiumProgressBarEnabled,
        });

        return new Guild(session, guild);
    }
}

export default Guild