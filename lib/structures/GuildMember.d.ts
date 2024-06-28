import { DiscordBase } from './extra/DiscordBase';
export type GuildMemberData = APIGuildMember | Omit<APIGuildMember, 'user'> | GatewayGuildMemberUpdateDispatchData | GatewayGuildMemberAddDispatchData | APIInteractionDataResolvedGuildMember;
import type { APIGuildMember, APIInteractionDataResolvedGuildMember, APIUser, GatewayGuildMemberAddDispatchData, GatewayGuildMemberUpdateDispatchData, RESTGetAPIGuildMembersQuery, RESTGetAPIGuildMembersSearchQuery, RESTPatchAPIGuildMemberJSONBody, RESTPutAPIGuildBanJSONBody, RESTPutAPIGuildMemberJSONBody } from 'discord-api-types/v10';
import type { UsingClient } from '../commands';
import { type MessageCreateBodyRequest, type ObjectToLower, type ToClass } from '../common';
import type { ImageOptions, MethodContext } from '../common/types/options';
import type { GuildMemberResolvable } from '../common/types/resolvables';
import { PermissionsBitField } from './extra/Permissions';
import { type UserStructure } from '../client/transformers';
export interface BaseGuildMember extends DiscordBase, ObjectToLower<Omit<APIGuildMember, 'user' | 'roles'>> {
}
export declare class BaseGuildMember extends DiscordBase {
    /** the choosen guild id */
    readonly guildId: string;
    private _roles;
    joinedTimestamp?: number;
    communicationDisabledUntilTimestamp?: number | null;
    constructor(client: UsingClient, data: GuildMemberData, id: string, 
    /** the choosen guild id */
    guildId: string);
    guild(force?: boolean): Promise<import("./Guild").Guild<"api">>;
    fetch(force?: boolean): Promise<GuildMember>;
    ban(body?: RESTPutAPIGuildBanJSONBody, reason?: string): Promise<void>;
    kick(reason?: string): Promise<void>;
    edit(body: RESTPatchAPIGuildMemberJSONBody, reason?: string): Promise<GuildMember>;
    presence(): import("..").ReturnCache<(Omit<import("discord-api-types/v10").GatewayPresenceUpdate, "user"> & {
        id: string;
        user_id: string;
    } & {
        guild_id: string;
    }) | undefined>;
    voice(): import("..").ReturnCache<import("./VoiceState").VoiceState | undefined>;
    toString(): `<@${string}>`;
    private patch;
    get roles(): {
        keys: string[];
        list: (force?: boolean) => Promise<import("./GuildRole").GuildRole[]>;
        add: (id: string) => void;
        remove: (id: string) => Promise<never>;
        permissions: (force?: boolean) => Promise<PermissionsBitField>;
        sorted: (force?: boolean) => Promise<import("./GuildRole").GuildRole[]>;
        highest: (force?: boolean) => Promise<import("./GuildRole").GuildRole>;
    };
    static methods({ client, guildId }: MethodContext<{
        guildId: string;
    }>): {
        resolve: (resolve: GuildMemberResolvable) => Promise<GuildMember | undefined>;
        search: (query?: RESTGetAPIGuildMembersSearchQuery) => Promise<GuildMember[]>;
        unban: (id: string, body?: RESTPutAPIGuildBanJSONBody, reason?: string) => Promise<void>;
        ban: (id: string, body?: RESTPutAPIGuildBanJSONBody, reason?: string) => Promise<void>;
        kick: (id: string, reason?: string) => Promise<void>;
        edit: (id: string, body: RESTPatchAPIGuildMemberJSONBody, reason?: string) => Promise<GuildMember>;
        add: (id: string, body: RESTPutAPIGuildMemberJSONBody) => Promise<GuildMember | undefined>;
        fetch: (memberId: string, force?: boolean) => Promise<GuildMember>;
        list: (query?: RESTGetAPIGuildMembersQuery, force?: boolean) => Promise<GuildMember[]>;
    };
}
export interface GuildMember extends ObjectToLower<Omit<APIGuildMember, 'user' | 'roles'>> {
}
/**
 * Represents a guild member
 * @link https://discord.com/developers/docs/resources/guild#guild-member-object
 */
export declare class GuildMember extends BaseGuildMember {
    /** the choosen guild id */
    readonly guildId: string;
    user: UserStructure;
    private __me?;
    constructor(client: UsingClient, data: GuildMemberData, user: APIUser, 
    /** the choosen guild id */
    guildId: string);
    get tag(): string;
    get bot(): boolean | undefined;
    get name(): string;
    get username(): string;
    get globalName(): string | null;
    /** gets the nickname or the username */
    get displayName(): string;
    dm(force?: boolean): Promise<import("./channels").DMChannel>;
    write(body: MessageCreateBodyRequest): Promise<import("./Message").Message>;
    defaultAvatarURL(): string;
    avatarURL(options: ImageOptions & {
        exclude: true;
    }): string | null;
    avatarURL(options?: ImageOptions & {
        exclude?: false;
    }): string;
    bannerURL(options?: ImageOptions): string | undefined;
    fetchPermissions(force?: boolean): Promise<PermissionsBitField>;
    manageable(force?: boolean): Promise<boolean>;
    bannable(force?: boolean): Promise<boolean>;
    kickable(force?: boolean): Promise<boolean>;
    moderatable(force?: boolean): Promise<boolean>;
}
export interface UnavailableMember {
    pending: true;
}
export declare class UnavailableMember extends BaseGuildMember {
}
export interface InteractionGuildMember extends ObjectToLower<Omit<APIInteractionDataResolvedGuildMember, 'roles' | 'deaf' | 'mute' | 'permissions'>> {
}
declare const InteractionGuildMember_base: ToClass<Omit<GuildMember, "deaf" | "mute">, InteractionGuildMember>;
/**
 * Represents a guild member
 * @link https://discord.com/developers/docs/resources/guild#guild-member-object
 */
export declare class InteractionGuildMember extends InteractionGuildMember_base {
    permissions: PermissionsBitField;
    constructor(client: UsingClient, data: APIInteractionDataResolvedGuildMember, user: APIUser, 
    /** the choosen guild id */
    guildId: string);
}
export {};
