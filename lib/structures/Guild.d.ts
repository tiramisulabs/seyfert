import type { APIGuild, GatewayGuildCreateDispatchData } from 'discord-api-types/v10';
import type { UsingClient } from '../commands';
import type { ObjectToLower, StructPropState, StructStates, ToClass } from '../common/types/util';
import { AutoModerationRule } from './AutoModerationRule';
import { GuildEmoji } from './GuildEmoji';
import { GuildMember } from './GuildMember';
import { GuildRole } from './GuildRole';
import { GuildTemplate } from './GuildTemplate';
import { Sticker } from './Sticker';
import { BaseGuild } from './extra/BaseGuild';
import type { DiscordBase } from './extra/DiscordBase';
import { GuildBan } from './GuildBan';
export interface Guild extends ObjectToLower<Omit<APIGuild, 'stickers' | 'emojis' | 'roles'>>, DiscordBase {
}
declare const Guild_base: ToClass<Omit<BaseGuild, "name" | "id" | "description" | "icon" | "splash" | "banner" | "features" | "welcomeScreen" | "verificationLevel" | "vanityUrlCode">, Guild<"api">>;
export declare class Guild<State extends StructStates = 'api'> extends Guild_base {
    joinedAt: StructPropState<number, State, 'create'>;
    memberCount: StructPropState<number, State, 'create'>;
    large: StructPropState<boolean, State, 'create'>;
    unavailable?: StructPropState<boolean, State, 'create'>;
    constructor(client: UsingClient, data: APIGuild | GatewayGuildCreateDispatchData);
    webhooks: {
        list: () => Promise<import("./Webhook").Webhook[]>;
    };
    get maxStickers(): MaxStickers;
    get maxEmojis(): MaxEmojis;
    fetchOwner(force?: boolean): Promise<GuildMember> | Promise<null>;
    templates: {
        fetch: (code: string) => Promise<GuildTemplate>;
        list: () => Promise<GuildTemplate[]>;
        create: (body: import("discord-api-types/v10").RESTPostAPIGuildTemplatesJSONBody) => Promise<GuildTemplate>;
        sync: (code: string) => Promise<GuildTemplate>;
        edit: (code: string, body: import("discord-api-types/v10").RESTPatchAPIGuildTemplateJSONBody) => Promise<GuildTemplate>;
        delete: (code: string) => Promise<GuildTemplate>;
    };
    stickers: {
        list: () => Promise<Sticker[]>;
        create: (payload: import("./Sticker").CreateStickerBodyRequest, reason?: string) => Promise<Sticker>;
        edit: (stickerId: string, body: import("discord-api-types/v10").RESTPatchAPIGuildStickerJSONBody, reason?: string) => Promise<Sticker>;
        fetch: (stickerId: string, force?: boolean) => Promise<Sticker>;
        delete: (stickerId: string, reason?: string) => Promise<void>;
    };
    members: {
        resolve: (resolve: import("../common").GuildMemberResolvable) => Promise<GuildMember | undefined>;
        search: (query?: import("discord-api-types/v10").RESTGetAPIGuildMembersSearchQuery) => Promise<GuildMember[]>;
        unban: (id: string, body?: import("discord-api-types/v10").RESTPutAPIGuildBanJSONBody, reason?: string) => Promise<void>;
        ban: (id: string, body?: import("discord-api-types/v10").RESTPutAPIGuildBanJSONBody, reason?: string) => Promise<void>;
        kick: (id: string, reason?: string) => Promise<void>;
        edit: (id: string, body: import("discord-api-types/v10").RESTPatchAPIGuildMemberJSONBody, reason?: string) => Promise<GuildMember>;
        add: (id: string, body: import("discord-api-types/v10").RESTPutAPIGuildMemberJSONBody) => Promise<GuildMember | undefined>;
        fetch: (memberId: string, force?: boolean) => Promise<GuildMember>;
        list: (query?: import("discord-api-types/v10").RESTGetAPIGuildMembersQuery, force?: boolean) => Promise<GuildMember[]>;
    };
    moderationRules: {
        list: () => Promise<AutoModerationRule[]>;
        create: (body: import("discord-api-types/v10").RESTPostAPIAutoModerationRuleJSONBody) => Promise<AutoModerationRule>;
        delete: (ruleId: string, reason?: string) => Promise<never>;
        fetch: (ruleId: string) => Promise<AutoModerationRule>;
        edit: (ruleId: string, body: import("discord-api-types/v10").RESTPatchAPIAutoModerationRuleJSONBody, reason?: string) => Promise<AutoModerationRule>;
    };
    roles: {
        create: (body: import("discord-api-types/v10").RESTPostAPIGuildRoleJSONBody) => Promise<GuildRole>;
        list: (force?: boolean) => Promise<GuildRole[]>;
        edit: (roleId: string, body: import("discord-api-types/v10").RESTPatchAPIGuildRoleJSONBody, reason?: string) => Promise<GuildRole>;
        delete: (roleId: string, reason?: string) => Promise<GuildRole>;
        editPositions: (body: import("discord-api-types/v10").RESTPatchAPIGuildRolePositionsJSONBody) => Promise<GuildRole[]>;
    };
    channels: {
        list: (force?: boolean) => Promise<import("./channels").AllChannels[]>;
        fetch: (id: string, force?: boolean) => Promise<import("./channels").AllChannels>;
        create: (body: import("discord-api-types/v10").RESTPostAPIGuildChannelJSONBody) => Promise<import("./channels").AllChannels>;
        delete: (id: string, reason?: string) => Promise<import("./channels").AllChannels>;
        edit: (id: string, body: import("discord-api-types/v10").RESTPatchAPIChannelJSONBody, reason?: string) => Promise<import("./channels").AllChannels>;
        editPositions: (body: import("discord-api-types/v10").RESTPatchAPIGuildChannelPositionsJSONBody) => Promise<never>;
    };
    emojis: {
        edit: (emojiId: string, body: import("discord-api-types/v10").RESTPatchAPIGuildEmojiJSONBody, reason?: string) => Promise<GuildEmoji>;
        create: (body: Parameters<import("../common").EmojiShorter["create"]>[1]) => Promise<GuildEmoji>;
        fetch: (emojiId: string, force?: boolean) => Promise<GuildEmoji>;
        list: (force?: boolean) => Promise<GuildEmoji[]>;
    };
    bans: {
        fetch: (userId: string, force?: boolean) => Promise<GuildBan>;
        list: (query?: import("discord-api-types/v10").RESTGetAPIGuildBansQuery, force?: boolean) => Promise<GuildBan[]>;
        create: (memberId: string, body?: Parameters<import("../common/shorters/bans").BanShorter["create"]>[2], reason?: string) => Promise<void>;
        remove: (memberId: string, reason?: string) => Promise<void>;
        bulkCreate: (body: Parameters<import("../common/shorters/bans").BanShorter["bulkCreate"]>[1], reason?: string) => Promise<import("discord-api-types/v10").RESTPostAPIGuildBulkBanResult>;
    };
}
/** Maximun custom guild emojis per level */
export type MaxEmojis = 50 | 100 | 150 | 250;
/** Maximun custom guild stickers per level */
export type MaxStickers = 5 | 15 | 30 | 60;
export {};
