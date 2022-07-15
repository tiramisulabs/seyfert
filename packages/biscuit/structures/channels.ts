/** Types */
import type { Model } from "./Base.ts";
import type { Snowflake } from "../Snowflake.ts";
import type { Session } from "../Session.ts";
import type { PermissionsOverwrites } from "../Util.ts";

/** External from vendor */
import {
    ChannelTypes,
    DiscordChannel,
    DiscordInvite,
    DiscordInviteMetadata,
    DiscordListArchivedThreads,
    DiscordMessage,
    DiscordThreadMember,
    DiscordWebhook,
    GatewayOpcodes,
    TargetTypes,
    VideoQualityModes,
} from "../../discordeno/mod.ts";

/** Functions and others */
import { calculateShardId } from "../../discordeno/gateway/calculateShardId.ts";
import { urlToBase64 } from "../util/urlToBase64.ts";

/** Classes and routes */
import * as Routes from "../Routes.ts";
import Message, { CreateMessage, EditMessage, ReactionResolvable } from "./Message.ts";
import Invite from "./Invite.ts";
import Webhook from "./Webhook.ts";
import User from "./User.ts";
import ThreadMember from "./ThreadMember.ts";

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

    isStage(): this is StageChannel {
        return this.type === ChannelTypes.GuildStageVoice;
    }

    toString(): string {
        return `<#${this.id}>`;
    }
}

/** TextChannel */
/**
 * Represents the options object to create an invitation
 *  @link https://discord.com/developers/docs/resources/channel#create-channel-invite-json-params
 */
export interface DiscordInviteOptions {
    maxAge?: number;
    maxUses?: number;
    unique?: boolean;
    temporary: boolean;
    reason?: string;
    targetType?: TargetTypes;
    targetUserId?: Snowflake;
    targetApplicationId?: Snowflake;
}

export interface CreateWebhook {
    name: string;
    avatar?: string;
    reason?: string;
}

export const textBasedChannels = [
    ChannelTypes.DM,
    ChannelTypes.GroupDm,
    ChannelTypes.GuildPrivateThread,
    ChannelTypes.GuildPublicThread,
    ChannelTypes.GuildNews,
    ChannelTypes.GuildVoice,
    ChannelTypes.GuildText,
];

export type TextBasedChannels =
    | ChannelTypes.DM
    | ChannelTypes.GroupDm
    | ChannelTypes.GuildPrivateThread
    | ChannelTypes.GuildPublicThread
    | ChannelTypes.GuildNews
    | ChannelTypes.GuildVoice
    | ChannelTypes.GuildText;

export class TextChannel {
    constructor(session: Session, data: DiscordChannel) {
        this.session = session;
        this.id = data.id;
        this.name = data.name;
        this.type = data.type as number;
        this.rateLimitPerUser = data.rate_limit_per_user ?? 0;
        this.nsfw = !!data.nsfw ?? false;

        if (data.last_message_id) {
            this.lastMessageId = data.last_message_id;
        }

        if (data.last_pin_timestamp) {
            this.lastPinTimestamp = data.last_pin_timestamp;
        }
    }

    readonly session: Session;
    readonly id: Snowflake;
    name?: string;
    type: TextBasedChannels;
    lastMessageId?: Snowflake;
    lastPinTimestamp?: string;
    rateLimitPerUser: number;
    nsfw: boolean;

    /**
     * Mixin
     */
    // deno-lint-ignore ban-types
    static applyTo(klass: Function, ignore: Array<keyof TextChannel> = []): void {
        const methods: Array<keyof TextChannel> = [
            "fetchPins",
            "createInvite",
            "fetchMessages",
            "sendTyping",
            "pinMessage",
            "unpinMessage",
            "addReaction",
            "removeReaction",
            "nukeReactions",
            "fetchPins",
            "sendMessage",
            "editMessage",
            "createWebhook",
        ];

        for (const method of methods) {
            if (ignore.includes(method)) continue;

            klass.prototype[method] = TextChannel.prototype[method];
        }
    }

    async fetchPins(): Promise<Message[] | []> {
        const messages = await this.session.rest.runMethod<DiscordMessage[]>(
            this.session.rest,
            "GET",
            Routes.CHANNEL_PINS(this.id),
        );
        return messages[0] ? messages.map((x: DiscordMessage) => new Message(this.session, x)) : [];
    }

    async createInvite(options?: DiscordInviteOptions): Promise<Invite> {
        const invite = await this.session.rest.runMethod<DiscordInvite>(
            this.session.rest,
            "POST",
            Routes.CHANNEL_INVITES(this.id),
            options
                ? {
                    max_age: options.maxAge,
                    max_uses: options.maxUses,
                    temporary: options.temporary,
                    unique: options.unique,
                    target_type: options.targetType,
                    target_user_id: options.targetUserId,
                    target_application_id: options.targetApplicationId,
                }
                : {},
        );

        return new Invite(this.session, invite);
    }

    async fetchMessages(options?: Routes.GetMessagesOptions): Promise<Message[] | []> {
        if (options?.limit! > 100) throw Error("Values must be between 0-100");
        const messages = await this.session.rest.runMethod<DiscordMessage[]>(
            this.session.rest,
            "GET",
            Routes.CHANNEL_MESSAGES(this.id, options),
        );
        return messages[0] ? messages.map((x) => new Message(this.session, x)) : [];
    }

    async sendTyping(): Promise<void> {
        await this.session.rest.runMethod<undefined>(
            this.session.rest,
            "POST",
            Routes.CHANNEL_TYPING(this.id),
        );
    }

    async pinMessage(messageId: Snowflake): Promise<void> {
        await Message.prototype.pin.call({ id: messageId, channelId: this.id, session: this.session });
    }

    async unpinMessage(messageId: Snowflake): Promise<void> {
        await Message.prototype.unpin.call({ id: messageId, channelId: this.id, session: this.session });
    }

    async addReaction(messageId: Snowflake, reaction: ReactionResolvable): Promise<void> {
        await Message.prototype.addReaction.call(
            { channelId: this.id, id: messageId, session: this.session },
            reaction,
        );
    }

    async removeReaction(
        messageId: Snowflake,
        reaction: ReactionResolvable,
        options?: { userId: Snowflake },
    ): Promise<void> {
        await Message.prototype.removeReaction.call(
            { channelId: this.id, id: messageId, session: this.session },
            reaction,
            options,
        );
    }

    async removeReactionEmoji(messageId: Snowflake, reaction: ReactionResolvable): Promise<void> {
        await Message.prototype.removeReactionEmoji.call(
            { channelId: this.id, id: messageId, session: this.session },
            reaction,
        );
    }

    async nukeReactions(messageId: Snowflake): Promise<void> {
        await Message.prototype.nukeReactions.call({ channelId: this.id, id: messageId });
    }

    async fetchReactions(
        messageId: Snowflake,
        reaction: ReactionResolvable,
        options?: Routes.GetReactions,
    ): Promise<User[]> {
        const users = await Message.prototype.fetchReactions.call(
            { channelId: this.id, id: messageId, session: this.session },
            reaction,
            options,
        );

        return users;
    }

    sendMessage(options: CreateMessage): Promise<Message> {
        return Message.prototype.reply.call({ channelId: this.id, session: this.session }, options);
    }

    editMessage(messageId: Snowflake, options: EditMessage): Promise<Message> {
        return Message.prototype.edit.call({ channelId: this.id, id: messageId, session: this.session }, options);
    }

    async createWebhook(options: CreateWebhook): Promise<Webhook> {
        const webhook = await this.session.rest.runMethod<DiscordWebhook>(
            this.session.rest,
            "POST",
            Routes.CHANNEL_WEBHOOKS(this.id),
            {
                name: options.name,
                avatar: options.avatar ? urlToBase64(options.avatar) : undefined,
                reason: options.reason,
            },
        );

        return new Webhook(this.session, webhook);
    }
}

/** GuildChannel */
/**
 * Represent the options object to create a thread channel
 * @link https://discord.com/developers/docs/resources/channel#start-thread-without-message
 */
export interface ThreadCreateOptions {
    name: string;
    autoArchiveDuration?: 60 | 1440 | 4320 | 10080;
    type: 10 | 11 | 12;
    invitable?: boolean;
    rateLimitPerUser?: number;
    reason?: string;
}

/**
 * Representations of the objects to edit a guild channel
 * @link https://discord.com/developers/docs/resources/channel#modify-channel-json-params-guild-channel
 */
export interface EditGuildChannelOptions {
    name?: string;
    position?: number;
    permissionOverwrites?: PermissionsOverwrites[];
}

export interface EditNewsChannelOptions extends EditGuildChannelOptions {
    type?: ChannelTypes.GuildNews | ChannelTypes.GuildText;
    topic?: string | null;
    nfsw?: boolean | null;
    parentId?: Snowflake | null;
    defaultAutoArchiveDuration?: number | null;
}

export interface EditGuildTextChannelOptions extends EditNewsChannelOptions {
    rateLimitPerUser?: number | null;
}

export interface EditStageChannelOptions extends EditGuildChannelOptions {
    bitrate?: number | null;
    rtcRegion?: Snowflake | null;
}

export interface EditVoiceChannelOptions extends EditStageChannelOptions {
    nsfw?: boolean | null;
    userLimit?: number | null;
    parentId?: Snowflake | null;
    videoQualityMode?: VideoQualityModes | null;
}

/**
 * Represents the option object to create a thread channel from a message
 * @link https://discord.com/developers/docs/resources/channel#start-thread-from-message
 */
export interface ThreadCreateOptions {
    name: string;
    autoArchiveDuration?: 60 | 1440 | 4320 | 10080;
    rateLimitPerUser?: number;
    messageId: Snowflake;
}
/**
 * @link https://discord.com/developers/docs/resources/channel#list-public-archived-threads-response-body
 */
export interface ReturnThreadsArchive {
    threads: Record<Snowflake, ThreadChannel>;
    members: Record<Snowflake, ThreadMember>;
    hasMore: boolean;
}

export class GuildChannel extends BaseChannel implements Model {
    constructor(session: Session, data: DiscordChannel, guildId: Snowflake) {
        super(session, data);
        this.type = data.type as number;
        this.guildId = guildId;
        this.position = data.position;
        data.topic ? this.topic = data.topic : null;
        data.parent_id ? this.parentId = data.parent_id : undefined;
    }

    override type: Exclude<ChannelTypes, ChannelTypes.DM | ChannelTypes.GroupDm>;
    guildId: Snowflake;
    topic?: string;
    position?: number;
    parentId?: Snowflake;

    async fetchInvites(): Promise<Invite[]> {
        const invites = await this.session.rest.runMethod<DiscordInviteMetadata[]>(
            this.session.rest,
            "GET",
            Routes.CHANNEL_INVITES(this.id),
        );

        return invites.map((invite) => new Invite(this.session, invite));
    }

    async edit(options: EditNewsChannelOptions): Promise<NewsChannel>;
    async edit(options: EditStageChannelOptions): Promise<StageChannel>;
    async edit(options: EditVoiceChannelOptions): Promise<VoiceChannel>;
    async edit(
        options: EditGuildTextChannelOptions | EditNewsChannelOptions | EditVoiceChannelOptions,
    ): Promise<Channel> {
        const channel = await this.session.rest.runMethod<DiscordChannel>(
            this.session.rest,
            "PATCH",
            Routes.CHANNEL(this.id),
            {
                name: options.name,
                type: "type" in options ? options.type : undefined,
                position: options.position,
                topic: "topic" in options ? options.topic : undefined,
                nsfw: "nfsw" in options ? options.nfsw : undefined,
                rate_limit_per_user: "rateLimitPerUser" in options ? options.rateLimitPerUser : undefined,
                bitrate: "bitrate" in options ? options.bitrate : undefined,
                user_limit: "userLimit" in options ? options.userLimit : undefined,
                permissions_overwrites: options.permissionOverwrites,
                parent_id: "parentId" in options ? options.parentId : undefined,
                rtc_region: "rtcRegion" in options ? options.rtcRegion : undefined,
                video_quality_mode: "videoQualityMode" in options ? options.videoQualityMode : undefined,
                default_auto_archive_duration: "defaultAutoArchiveDuration" in options
                    ? options.defaultAutoArchiveDuration
                    : undefined,
            },
        );
        return ChannelFactory.from(this.session, channel);
    }

    async getArchivedThreads(
        options: Routes.ListArchivedThreads & { type: "public" | "private" | "privateJoinedThreads" },
    ): Promise<ReturnThreadsArchive> {
        let func: (channelId: Snowflake, options: Routes.ListArchivedThreads) => string;

        switch (options.type) {
            case "public":
                func = Routes.THREAD_ARCHIVED_PUBLIC;
                break;
            case "private":
                func = Routes.THREAD_START_PRIVATE;
                break;
            case "privateJoinedThreads":
                func = Routes.THREAD_ARCHIVED_PRIVATE_JOINED;
                break;
        }

        const { threads, members, has_more } = await this.session.rest.runMethod<DiscordListArchivedThreads>(
            this.session.rest,
            "GET",
            func(this.id, options),
        );

        return {
            threads: Object.fromEntries(
                threads.map((thread) => [thread.id, new ThreadChannel(this.session, thread, this.id)]),
            ) as Record<Snowflake, ThreadChannel>,
            members: Object.fromEntries(
                members.map((threadMember) => [threadMember.id, new ThreadMember(this.session, threadMember)]),
            ) as Record<Snowflake, ThreadMember>,
            hasMore: has_more,
        };
    }

    async createThread(options: ThreadCreateOptions): Promise<ThreadChannel> {
        const thread = await this.session.rest.runMethod<DiscordChannel>(
            this.session.rest,
            "POST",
            "messageId" in options
                ? Routes.THREAD_START_PUBLIC(this.id, options.messageId)
                : Routes.THREAD_START_PRIVATE(this.id),
            {
                name: options.name,
                auto_archive_duration: options.autoArchiveDuration,
            },
        );

        return new ThreadChannel(this.session, thread, thread.guild_id ?? this.guildId);
    }
}

/** BaseVoiceChannel */
/**
 * @link https://discord.com/developers/docs/topics/gateway#update-voice-state
 */
export interface UpdateVoiceState {
    guildId: string;
    channelId?: string;
    selfMute: boolean;
    selfDeaf: boolean;
}

export abstract class BaseVoiceChannel extends GuildChannel {
    constructor(session: Session, data: DiscordChannel, guildId: Snowflake) {
        super(session, data, guildId);
        this.bitRate = data.bitrate;
        this.userLimit = data.user_limit ?? 0;
        this.videoQuality = data.video_quality_mode;
        this.nsfw = !!data.nsfw;
        this.type = data.type as number;

        if (data.rtc_region) {
            this.rtcRegion = data.rtc_region;
        }
    }
    override type: ChannelTypes.GuildVoice | ChannelTypes.GuildStageVoice;
    bitRate?: number;
    userLimit: number;
    rtcRegion?: Snowflake;

    videoQuality?: VideoQualityModes;
    nsfw: boolean;

    /**
     * This function was gathered from Discordeno it may not work
     */
    async connect(options?: UpdateVoiceState): Promise<void> {
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

/** DMChannel */
export class DMChannel extends BaseChannel implements Model {
    constructor(session: Session, data: DiscordChannel) {
        super(session, data);
        this.user = new User(this.session, data.recipents!.find((r) => r.id !== this.session.botId)!);
        this.type = data.type as ChannelTypes.DM | ChannelTypes.GroupDm;
        if (data.last_message_id) {
            this.lastMessageId = data.last_message_id;
        }
    }

    override type: ChannelTypes.DM | ChannelTypes.GroupDm;
    user: User;
    lastMessageId?: Snowflake;

    async close(): Promise<DMChannel> {
        const channel = await this.session.rest.runMethod<DiscordChannel>(
            this.session.rest,
            "DELETE",
            Routes.CHANNEL(this.id),
        );

        return new DMChannel(this.session, channel);
    }
}

export interface DMChannel extends Omit<TextChannel, "type">, Omit<BaseChannel, "type"> {}

TextChannel.applyTo(DMChannel);

/** VoiceChannel */
export class VoiceChannel extends BaseVoiceChannel {
    constructor(session: Session, data: DiscordChannel, guildId: Snowflake) {
        super(session, data, guildId);
        this.type = data.type as number;
    }
    override type: ChannelTypes.GuildVoice;
}

export interface VoiceChannel extends TextChannel, BaseVoiceChannel {}

TextChannel.applyTo(VoiceChannel);

/** NewsChannel */
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

TextChannel.applyTo(NewsChannel);

export interface NewsChannel extends TextChannel, GuildChannel {}

/** StageChannel */
export class StageChannel extends BaseVoiceChannel {
    constructor(session: Session, data: DiscordChannel, guildId: Snowflake) {
        super(session, data, guildId);
        this.type = data.type as number;
        this.topic = data.topic ? data.topic : undefined;
    }
    override type: ChannelTypes.GuildStageVoice;
    topic?: string;
}

/** ThreadChannel */
export class ThreadChannel extends GuildChannel implements Model {
    constructor(session: Session, data: DiscordChannel, guildId: Snowflake) {
        super(session, data, guildId);
        this.type = data.type as number;
        this.archived = !!data.thread_metadata?.archived;
        this.archiveTimestamp = data.thread_metadata?.archive_timestamp;
        this.autoArchiveDuration = data.thread_metadata?.auto_archive_duration;
        this.locked = !!data.thread_metadata?.locked;
        this.messageCount = data.message_count;
        this.memberCount = data.member_count;
        this.ownerId = data.owner_id;

        if (data.member) {
            this.member = new ThreadMember(session, data.member);
        }
    }

    override type: ChannelTypes.GuildNewsThread | ChannelTypes.GuildPrivateThread | ChannelTypes.GuildPublicThread;
    archived?: boolean;
    archiveTimestamp?: string;
    autoArchiveDuration?: number;
    locked?: boolean;
    messageCount?: number;
    memberCount?: number;
    member?: ThreadMember;
    ownerId?: Snowflake;

    async joinThread(): Promise<void> {
        await this.session.rest.runMethod<undefined>(
            this.session.rest,
            "PUT",
            Routes.THREAD_ME(this.id),
        );
    }

    async addToThread(guildMemberId: Snowflake): Promise<void> {
        await this.session.rest.runMethod<undefined>(
            this.session.rest,
            "PUT",
            Routes.THREAD_USER(this.id, guildMemberId),
        );
    }

    async leaveToThread(guildMemberId: Snowflake): Promise<void> {
        await this.session.rest.runMethod<undefined>(
            this.session.rest,
            "DELETE",
            Routes.THREAD_USER(this.id, guildMemberId),
        );
    }

    removeMember(memberId: Snowflake = this.session.botId): Promise<void> {
        return ThreadMember.prototype.quitThread.call({ id: this.id, session: this.session }, memberId);
    }

    fetchMember(memberId: Snowflake = this.session.botId): Promise<ThreadMember> {
        return ThreadMember.prototype.fetchMember.call({ id: this.id, session: this.session }, memberId);
    }

    async fetchMembers(): Promise<ThreadMember[]> {
        const members = await this.session.rest.runMethod<DiscordThreadMember[]>(
            this.session.rest,
            "GET",
            Routes.THREAD_MEMBERS(this.id),
        );

        return members.map((threadMember) => new ThreadMember(this.session, threadMember));
    }
}

export interface ThreadChannel extends Omit<GuildChannel, "type">, Omit<TextChannel, "type"> {}

TextChannel.applyTo(ThreadChannel);

export class GuildTextChannel extends GuildChannel {
    constructor(session: Session, data: DiscordChannel, guildId: Snowflake) {
        super(session, data, guildId);
        this.type = data.type as ChannelTypes.GuildText;
    }

    override type: ChannelTypes.GuildText;
}

export interface GuildTextChannel extends GuildChannel, TextChannel {}

TextChannel.applyTo(GuildTextChannel);

/** ChannelFactory */
export type Channel =
    | GuildTextChannel
    | TextChannel
    | VoiceChannel
    | DMChannel
    | NewsChannel
    | ThreadChannel
    | StageChannel;

export type ChannelInGuild =
    | GuildTextChannel
    | VoiceChannel
    | StageChannel
    | NewsChannel
    | ThreadChannel;

export type ChannelWithMessages =
    | GuildTextChannel
    | VoiceChannel
    | DMChannel
    | NewsChannel
    | ThreadChannel;

export type ChannelWithMessagesInGuild = Exclude<ChannelWithMessages, DMChannel>;

export class ChannelFactory {
    static fromGuildChannel(session: Session, channel: DiscordChannel): ChannelInGuild {
        switch (channel.type) {
            case ChannelTypes.GuildPublicThread:
            case ChannelTypes.GuildPrivateThread:
                return new ThreadChannel(session, channel, channel.guild_id!);
            case ChannelTypes.GuildText:
                return new GuildTextChannel(session, channel, channel.guild_id!);
            case ChannelTypes.GuildNews:
                return new NewsChannel(session, channel, channel.guild_id!);
            case ChannelTypes.GuildVoice:
                return new VoiceChannel(session, channel, channel.guild_id!);
            case ChannelTypes.GuildStageVoice:
                return new StageChannel(session, channel, channel.guild_id!);
            default:
                throw new Error("Channel was not implemented");
        }
    }

    static from(session: Session, channel: DiscordChannel): Channel {
        switch (channel.type) {
            case ChannelTypes.GuildPublicThread:
            case ChannelTypes.GuildPrivateThread:
                return new ThreadChannel(session, channel, channel.guild_id!);
            case ChannelTypes.GuildText:
                return new GuildTextChannel(session, channel, channel.guild_id!);
            case ChannelTypes.GuildNews:
                return new NewsChannel(session, channel, channel.guild_id!);
            case ChannelTypes.DM:
                return new DMChannel(session, channel);
            case ChannelTypes.GuildVoice:
                return new VoiceChannel(session, channel, channel.guild_id!);
            case ChannelTypes.GuildStageVoice:
                return new StageChannel(session, channel, channel.guild_id!);
            default:
                if (textBasedChannels.includes(channel.type)) {
                    return new TextChannel(session, channel);
                }
                throw new Error("Channel was not implemented");
        }
    }
}
