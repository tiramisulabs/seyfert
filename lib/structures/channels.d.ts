import { ChannelType, VideoQualityMode, type APIChannelBase, type APIDMChannel, type APIGuildCategoryChannel, type APIGuildChannel, type APIGuildForumChannel, type APIGuildForumDefaultReactionEmoji, type APIGuildForumTag, type APIGuildMediaChannel, type APIGuildStageVoiceChannel, type APIGuildVoiceChannel, type APINewsChannel, type APITextChannel, type APIThreadChannel, type RESTGetAPIChannelMessageReactionUsersQuery, type RESTPatchAPIChannelJSONBody, type RESTPatchAPIGuildChannelPositionsJSONBody, type RESTPostAPIChannelWebhookJSONBody, type RESTPostAPIGuildChannelJSONBody, type RESTPostAPIGuildForumThreadsJSONBody, type SortOrderType, type ThreadAutoArchiveDuration } from 'discord-api-types/v10';
import type { UsingClient } from '../commands';
import type { EmojiResolvable, MessageCreateBodyRequest, MessageUpdateBodyRequest, MethodContext, ObjectToLower, StringToNumber, ToClass } from '../common';
import type { GuildMember } from './GuildMember';
import type { GuildRole } from './GuildRole';
import { DiscordBase } from './extra/DiscordBase';
import { Collection, type RawFile } from '..';
import { type BaseChannelStructure, type BaseGuildChannelStructure, type CategoryChannelStructure, type DMChannelStructure, type DirectoryChannelStructure, type ForumChannelStructure, type MediaChannelStructure, type NewsChannelStructure, type StageChannelStructure, type TextGuildChannelStructure, type ThreadChannelStructure, type VoiceChannelStructure } from '../client/transformers';
export declare class BaseChannel<T extends ChannelType> extends DiscordBase<APIChannelBase<ChannelType>> {
    type: T;
    constructor(client: UsingClient, data: APIChannelBase<ChannelType>);
    static __intent__(id: '@me'): 'DirectMessages';
    static __intent__(id: string): 'DirectMessages' | 'Guilds';
    /** The URL to the channel */
    get url(): string;
    fetch(force?: boolean): Promise<AllChannels>;
    delete(reason?: string): Promise<AllChannels>;
    edit(body: RESTPatchAPIChannelJSONBody, reason?: string): Promise<AllChannels>;
    toString(): `<#${string}>`;
    isStage(): this is StageChannel;
    isMedia(): this is MediaChannel;
    isDM(): this is DMChannel;
    isForum(): this is ForumChannel;
    isThread(): this is ThreadChannel;
    isDirectory(): this is DirectoryChannel;
    isVoice(): this is VoiceChannel;
    isTextGuild(): this is TextGuildChannel;
    isCategory(): this is CategoryChannel;
    isNews(): this is NewsChannel;
    isTextable(): this is AllTextableChannels;
    isGuildTextable(): this is AllGuildTextableChannels;
    isThreadOnly(): this is ForumChannel | MediaChannel;
    is<T extends (keyof IChannelTypes)[]>(channelTypes: T): this is IChannelTypes[T[number]];
    static allMethods(ctx: MethodContext<{
        guildId: string;
    }>): {
        list: (force?: boolean) => Promise<AllChannels[]>;
        fetch: (id: string, force?: boolean) => Promise<AllChannels>;
        create: (body: RESTPostAPIGuildChannelJSONBody) => Promise<AllChannels>;
        delete: (id: string, reason?: string) => Promise<AllChannels>;
        edit: (id: string, body: RESTPatchAPIChannelJSONBody, reason?: string) => Promise<AllChannels>;
        editPositions: (body: RESTPatchAPIGuildChannelPositionsJSONBody) => Promise<never>;
    };
}
interface IChannelTypes {
    GuildStageVoice: StageChannel;
    GuildMedia: MediaChannel;
    DM: DMChannel;
    GuildForum: ForumChannel;
    AnnouncementThread: ThreadChannel;
    PrivateThread: ThreadChannel;
    PublicThread: ThreadChannel;
    GuildDirectory: DirectoryChannel;
    GuildVoice: VoiceChannel;
    GuildText: TextGuildChannel;
    GuildCategory: CategoryChannel;
    GuildAnnouncement: NewsChannel;
}
export interface BaseGuildChannel extends ObjectToLower<Omit<APIGuildChannel<ChannelType>, 'permission_overwrites'>> {
}
export declare class BaseGuildChannel extends BaseChannel<ChannelType> {
    constructor(client: UsingClient, data: APIGuildChannel<ChannelType>);
    permissionOverwrites: {
        fetch: () => import("..").ReturnCache<{
            type: number;
            id: string;
            deny: import("./extra/Permissions").PermissionsBitField;
            allow: import("./extra/Permissions").PermissionsBitField;
            guildId: string;
        }[] | undefined>;
        values: () => {
            type: number;
            id: string;
            deny: import("./extra/Permissions").PermissionsBitField;
            allow: import("./extra/Permissions").PermissionsBitField;
            guildId: string;
        }[][];
    };
    memberPermissions(member: GuildMember, checkAdmin?: boolean): Promise<import("./extra/Permissions").PermissionsBitField>;
    rolePermissions(role: GuildRole, checkAdmin?: boolean): Promise<import("./extra/Permissions").PermissionsBitField>;
    overwritesFor(member: GuildMember): Promise<{
        everyone: {
            type: number;
            id: string;
            deny: import("./extra/Permissions").PermissionsBitField;
            allow: import("./extra/Permissions").PermissionsBitField;
            guildId: string;
        } | undefined;
        roles: {
            type: number;
            id: string;
            deny: import("./extra/Permissions").PermissionsBitField;
            allow: import("./extra/Permissions").PermissionsBitField;
            guildId: string;
        }[];
        member: {
            type: number;
            id: string;
            deny: import("./extra/Permissions").PermissionsBitField;
            allow: import("./extra/Permissions").PermissionsBitField;
            guildId: string;
        } | undefined;
    }>;
    guild(force?: boolean): Promise<import("./Guild").Guild<"api">>;
    get url(): string;
    setPosition(position: number, reason?: string): Promise<AllChannels>;
    setName(name: string, reason?: string): Promise<AllChannels>;
    setParent(parent_id: string | null, reason?: string): Promise<AllChannels>;
}
export interface MessagesMethods extends BaseChannel<ChannelType> {
}
export declare class MessagesMethods extends DiscordBase {
    typing(): Promise<void>;
    messages: {
        write: (body: MessageCreateBodyRequest) => Promise<import("./Message").Message>;
        edit: (messageId: string, body: MessageUpdateBodyRequest) => Promise<import("./Message").Message>;
        crosspost: (messageId: string, reason?: string) => Promise<import("./Message").Message>;
        delete: (messageId: string, reason?: string) => Promise<void>;
        fetch: (messageId: string) => Promise<import("./Message").Message>;
        purge: (messages: string[], reason?: string) => Promise<void | undefined>;
    };
    pins: {
        fetch: () => Promise<import("./Message").Message[]>;
        set: (messageId: string, reason?: string) => Promise<never>;
        delete: (messageId: string, reason?: string) => Promise<never>;
    };
    reactions: {
        add: (messageId: string, emoji: EmojiResolvable) => Promise<void>;
        delete: (messageId: string, emoji: EmojiResolvable, userId?: string) => Promise<void>;
        fetch: (messageId: string, emoji: EmojiResolvable, query?: RESTGetAPIChannelMessageReactionUsersQuery) => Promise<import("./User").User[]>;
        purge: (messageId: string, emoji?: EmojiResolvable) => Promise<void>;
    };
    static messages(ctx: MethodContext<{
        channelId: string;
    }>): {
        write: (body: MessageCreateBodyRequest) => Promise<import("./Message").Message>;
        edit: (messageId: string, body: MessageUpdateBodyRequest) => Promise<import("./Message").Message>;
        crosspost: (messageId: string, reason?: string) => Promise<import("./Message").Message>;
        delete: (messageId: string, reason?: string) => Promise<void>;
        fetch: (messageId: string) => Promise<import("./Message").Message>;
        purge: (messages: string[], reason?: string) => Promise<void | undefined>;
    };
    static reactions(ctx: MethodContext<{
        channelId: string;
    }>): {
        add: (messageId: string, emoji: EmojiResolvable) => Promise<void>;
        delete: (messageId: string, emoji: EmojiResolvable, userId?: string) => Promise<void>;
        fetch: (messageId: string, emoji: EmojiResolvable, query?: RESTGetAPIChannelMessageReactionUsersQuery) => Promise<import("./User").User[]>;
        purge: (messageId: string, emoji?: EmojiResolvable) => Promise<void>;
    };
    static pins(ctx: MethodContext<{
        channelId: string;
    }>): {
        fetch: () => Promise<import("./Message").Message[]>;
        set: (messageId: string, reason?: string) => Promise<never>;
        delete: (messageId: string, reason?: string) => Promise<never>;
    };
    static transformMessageBody<T>(body: MessageCreateBodyRequest | MessageUpdateBodyRequest, files: RawFile[] | undefined, self: UsingClient): T;
}
export interface TextBaseGuildChannel extends ObjectToLower<Omit<APITextChannel, 'type' | 'permission_overwrites'>>, MessagesMethods {
}
export declare class TextBaseGuildChannel extends BaseGuildChannel {
}
export default function channelFrom(data: APIChannelBase<ChannelType>, client: UsingClient): AllChannels;
export interface TopicableGuildChannel extends BaseChannel<ChannelType> {
}
export declare class TopicableGuildChannel extends DiscordBase {
    setTopic(topic: string | null, reason?: string): Promise<AllChannels>;
}
export interface ThreadOnlyMethods extends BaseChannel<ChannelType>, TopicableGuildChannel {
}
export declare class ThreadOnlyMethods extends DiscordBase {
    setTags(tags: APIGuildForumTag[], reason?: string): Promise<AllChannels>;
    setAutoArchiveDuration(duration: ThreadAutoArchiveDuration, reason?: string): Promise<AllChannels>;
    setReactionEmoji(emoji: APIGuildForumDefaultReactionEmoji, reason?: string): Promise<AllChannels>;
    setSortOrder(sort: SortOrderType, reason?: string): Promise<AllChannels>;
    setThreadRateLimit(rate: number, reason?: string): Promise<AllChannels>;
    thread(body: RESTPostAPIGuildForumThreadsJSONBody, reason?: string): Promise<ThreadChannel>;
}
export interface VoiceChannelMethods extends BaseChannel<ChannelType> {
}
export declare class VoiceChannelMethods extends DiscordBase {
    guildId?: string;
    setBitrate(bitrate: number | null, reason?: string): Promise<AllChannels>;
    setUserLimit(user_limit: number | null, reason?: string): Promise<AllChannels>;
    setRTC(rtc_region: string | null, reason?: string): Promise<AllChannels>;
    setVideoQuality(quality: keyof typeof VideoQualityMode, reason?: string): Promise<AllChannels>;
    setVoiceState(status?: string | null): Promise<never>;
    states(): Promise<import("./VoiceState").VoiceState[]>;
    members(force?: boolean): Promise<Collection<string, GuildMember>>;
}
export declare class WebhookGuildMethods extends DiscordBase {
    webhooks: {
        list: () => Promise<import("./Webhook").Webhook[]>;
    };
    static guild(ctx: MethodContext<{
        guildId: string;
    }>): {
        list: () => Promise<import("./Webhook").Webhook[]>;
    };
}
export declare class WebhookChannelMethods extends DiscordBase {
    webhooks: {
        list: () => Promise<import("./Webhook").Webhook[]>;
        create: (body: RESTPostAPIChannelWebhookJSONBody) => Promise<import("./Webhook").Webhook>;
    };
    static channel(ctx: MethodContext<{
        channelId: string;
    }>): {
        list: () => Promise<import("./Webhook").Webhook[]>;
        create: (body: RESTPostAPIChannelWebhookJSONBody) => Promise<import("./Webhook").Webhook>;
    };
}
export interface TextGuildChannel extends ObjectToLower<Omit<APITextChannel, 'type' | 'permission_overwrites'>>, BaseGuildChannel, TextBaseGuildChannel, WebhookChannelMethods {
}
export declare class TextGuildChannel extends BaseGuildChannel {
    type: ChannelType.GuildText;
    setRatelimitPerUser(rate_limit_per_user: number | null | undefined): Promise<AllChannels>;
    setNsfw(nsfw?: boolean, reason?: string): Promise<AllChannels>;
}
export interface DMChannel extends ObjectToLower<APIDMChannel>, Omit<MessagesMethods, 'edit'> {
}
declare const DMChannel_base: ToClass<Omit<BaseChannel<ChannelType.DM>, "edit">, DMChannel>;
export declare class DMChannel extends DMChannel_base {
    type: ChannelType.DM;
}
export interface VoiceChannel extends ObjectToLower<Omit<APIGuildVoiceChannel, 'permission_overwrites'>>, Omit<TextGuildChannel, 'type'>, VoiceChannelMethods, WebhookChannelMethods {
}
export declare class VoiceChannel extends BaseChannel<ChannelType.GuildVoice> {
    type: ChannelType.GuildVoice;
}
export interface StageChannel extends ObjectToLower<Omit<APIGuildStageVoiceChannel, 'type'>>, TopicableGuildChannel, VoiceChannelMethods {
}
export declare class StageChannel extends BaseChannel<ChannelType> {
    type: ChannelType.GuildStageVoice;
}
export interface MediaChannel extends ObjectToLower<Omit<APIGuildMediaChannel, 'type'>>, ThreadOnlyMethods {
}
export declare class MediaChannel extends BaseChannel<ChannelType> {
    type: ChannelType.GuildMedia;
}
export interface ForumChannel extends ObjectToLower<APIGuildForumChannel>, Omit<ThreadOnlyMethods, 'type'>, WebhookChannelMethods {
}
export declare class ForumChannel extends BaseChannel<ChannelType.GuildForum> {
    type: ChannelType.GuildForum;
}
export interface ThreadChannel extends ObjectToLower<Omit<APIThreadChannel, 'permission_overwrites'>>, TextBaseGuildChannel {
}
export declare class ThreadChannel extends BaseChannel<ChannelType.PublicThread | ChannelType.AnnouncementThread | ChannelType.PrivateThread> {
    type: ChannelType.PublicThread | ChannelType.AnnouncementThread | ChannelType.PrivateThread;
    webhooks: {
        list: () => Promise<import("./Webhook").Webhook[]>;
        create: (body: RESTPostAPIChannelWebhookJSONBody) => Promise<import("./Webhook").Webhook>;
    };
    join(): Promise<this>;
    leave(): Promise<this>;
    setRatelimitPerUser(rate_limit_per_user: number | null | undefined): Promise<AllChannels>;
    pin(reason?: string): Promise<AllChannels>;
    unpin(reason?: string): Promise<AllChannels>;
    setTags(applied_tags: string[], reason?: string): Promise<AllChannels>;
    setArchived(archived?: boolean, reason?: string): Promise<AllChannels>;
    setAutoArchiveDuration(auto_archive_duration: StringToNumber<`${ThreadAutoArchiveDuration}`>, reason?: string): Promise<AllChannels>;
    setInvitable(invitable?: boolean, reason?: string): Promise<AllChannels>;
    setLocked(locked?: boolean, reason?: string): Promise<AllChannels>;
}
export interface CategoryChannel extends ObjectToLower<Omit<APIGuildCategoryChannel, 'permission_overwrites'>> {
}
declare const CategoryChannel_base: ToClass<Omit<BaseGuildChannel, "type" | "setParent">, CategoryChannel>;
export declare class CategoryChannel extends CategoryChannel_base {
    type: ChannelType.GuildCategory;
}
export interface NewsChannel extends ObjectToLower<APINewsChannel>, WebhookChannelMethods {
}
export declare class NewsChannel extends BaseChannel<ChannelType.GuildAnnouncement> {
    type: ChannelType.GuildAnnouncement;
    addFollower(webhookChannelId: string, reason?: string): Promise<import("discord-api-types/v10").APIFollowedChannel>;
}
export declare class DirectoryChannel extends BaseChannel<ChannelType.GuildDirectory> {
}
export type AllGuildChannels = TextGuildChannelStructure | VoiceChannelStructure | MediaChannelStructure | ForumChannelStructure | ThreadChannelStructure | CategoryChannelStructure | NewsChannelStructure | DirectoryChannelStructure | StageChannelStructure;
export type AllTextableChannels = TextGuildChannelStructure | VoiceChannelStructure | DMChannelStructure | NewsChannelStructure | ThreadChannelStructure;
export type AllGuildTextableChannels = TextGuildChannelStructure | VoiceChannelStructure | NewsChannelStructure | ThreadChannelStructure;
export type AllGuildVoiceChannels = VoiceChannelStructure | StageChannelStructure;
export type AllChannels = BaseChannelStructure | BaseGuildChannelStructure | TextGuildChannelStructure | DMChannelStructure | VoiceChannelStructure | MediaChannelStructure | ForumChannelStructure | ThreadChannelStructure | CategoryChannelStructure | NewsChannelStructure | DirectoryChannelStructure | StageChannelStructure;
export {};
