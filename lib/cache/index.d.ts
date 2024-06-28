import { Logger, type If } from '../common';
import type { Adapter } from './adapters';
import { Guilds } from './resources/guilds';
import { Users } from './resources/users';
import { Channels } from './resources/channels';
import { Emojis } from './resources/emojis';
import { Members } from './resources/members';
import { Presences } from './resources/presence';
import { Roles } from './resources/roles';
import { StageInstances } from './resources/stage-instances';
import { Stickers } from './resources/stickers';
import { Threads } from './resources/threads';
import { VoiceStates } from './resources/voice-states';
import { Bans } from './resources/bans';
import { GatewayIntentBits, type GatewayDispatchPayload } from 'discord-api-types/v10';
import type { InternalOptions, UsingClient } from '../commands';
import { Overwrites } from './resources/overwrites';
import { Messages } from './resources/messages';
export type InferAsyncCache = InternalOptions extends {
    asyncCache: infer P;
} ? P : false;
export type ReturnCache<T> = If<InferAsyncCache, Promise<T>, T>;
export type GuildBased = 'members' | 'voiceStates';
export type GuildRelated = 'emojis' | 'roles' | 'threads' | 'channels' | 'stickers' | 'presences' | 'stageInstances' | 'overwrites' | 'messages' | 'bans';
export type NonGuildBased = 'users' | 'guilds';
export * from './adapters/index';
export type CachedEvents = 'READY' | 'GUILD_CREATE' | 'GUILD_UPDATE' | 'GUILD_DELETE' | 'CHANNEL_CREATE' | 'CHANNEL_UPDATE' | 'CHANNEL_DELETE' | 'GUILD_ROLE_CREATE' | 'GUILD_ROLE_UPDATE' | 'GUILD_ROLE_DELETE' | 'GUILD_BAN_ADD' | 'GUILD_BAN_REMOVE' | 'GUILD_EMOJIS_UPDATE' | 'GUILD_STICKERS_UPDATE' | 'GUILD_MEMBER_ADD' | 'GUILD_MEMBER_UPDATE' | 'GUILD_MEMBER_REMOVE' | 'MESSAGE_CREATE' | 'PRESENCE_UPDATE' | 'THREAD_DELETE' | 'THREAD_CREATE' | 'THREAD_UPDATE' | 'USER_UPDATE' | 'VOICE_STATE_UPDATE' | 'STAGE_INSTANCE_CREATE' | 'STAGE_INSTANCE_UPDATE' | 'STAGE_INSTANCE_DELETE';
export declare class Cache {
    intents: number;
    adapter: Adapter;
    readonly disabledCache: (NonGuildBased | GuildBased | GuildRelated)[];
    users?: Users;
    guilds?: Guilds;
    members?: Members;
    voiceStates?: VoiceStates;
    overwrites?: Overwrites;
    roles?: Roles;
    emojis?: Emojis;
    threads?: Threads;
    channels?: Channels;
    stickers?: Stickers;
    presences?: Presences;
    stageInstances?: StageInstances;
    messages?: Messages;
    bans?: Bans;
    __logger__?: Logger;
    constructor(intents: number, adapter: Adapter, disabledCache?: (NonGuildBased | GuildBased | GuildRelated)[], client?: UsingClient);
    flush(): ReturnCache<void>;
    hasIntent(intent: keyof typeof GatewayIntentBits): boolean;
    get hasGuildsIntent(): boolean;
    get hasRolesIntent(): boolean;
    get hasChannelsIntent(): boolean;
    get hasGuildMembersIntent(): boolean;
    get hasEmojisAndStickersIntent(): boolean;
    get hasVoiceStatesIntent(): boolean;
    get hasPrenseceUpdates(): boolean;
    get hasDirectMessages(): boolean;
    get hasBansIntent(): boolean;
    bulkGet(keys: (readonly [
        NonGuildBased | GuildRelated,
        string
    ] | readonly [
        GuildBased,
        string,
        string
    ])[]): Promise<Partial<{
        guilds: import("..").Guild<"cached">[];
        roles: import("..").GuildRole[];
        emojis: import("..").GuildEmoji[];
        stickers: import("..").Sticker[];
        channels: NonNullable<ReturnCache<import("..").AllChannels | undefined>>[];
        members: import("..").GuildMember[];
        users: import("..").User[];
        messages: import("..").Message[];
        presences: (Omit<import("discord-api-types/v10").GatewayPresenceUpdate, "user"> & {
            id: string;
            user_id: string;
        } & {
            guild_id: string;
        })[];
        threads: import("..").ThreadChannel[];
        bans: import("../structures/GuildBan").GuildBan[];
        voiceStates: import("..").VoiceState[];
        stageInstances: (import("discord-api-types/v10").APIStageInstance & {
            guild_id: string;
        })[];
        overwrites: {
            type: number;
            id: string;
            deny: import("../structures/extra/Permissions").PermissionsBitField;
            allow: import("../structures/extra/Permissions").PermissionsBitField;
            guildId: string;
        }[][];
    }>>;
    bulkPatch(keys: (readonly [
        NonGuildBased,
        any,
        string
    ] | readonly [
        GuildBased | GuildRelated,
        any,
        string,
        string
    ])[]): Promise<void>;
    bulkSet(keys: (readonly [
        NonGuildBased,
        any,
        string
    ] | readonly [
        GuildBased | GuildRelated,
        any,
        string,
        string
    ])[]): Promise<void>;
    onPacket(event: GatewayDispatchPayload): Promise<void>;
    testAdapter(): Promise<void>;
    private testUsersAndMembers;
    private testChannelsAndOverwrites;
}
