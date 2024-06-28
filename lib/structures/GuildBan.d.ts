import type { APIBan, RESTGetAPIGuildBansQuery } from 'discord-api-types/v10';
import type { UsingClient } from '../commands';
import { type MethodContext, type ObjectToLower } from '../common';
import { DiscordBase } from './extra/DiscordBase';
import type { BanShorter } from '../common/shorters/bans';
export interface GuildBan extends DiscordBase, ObjectToLower<Omit<APIBan, 'id'>> {
}
export declare class GuildBan extends DiscordBase {
    readonly guildId: string;
    constructor(client: UsingClient, data: APIBan, guildId: string);
    create(body?: Parameters<BanShorter['create']>[2], reason?: string): Promise<void>;
    remove(reason?: string): Promise<void>;
    guild(force?: boolean): Promise<import("./Guild").Guild<"api">>;
    fetch(force?: boolean): Promise<GuildBan>;
    toString(): `<@${string}>`;
    static methods({ client, guildId }: MethodContext<{
        guildId: string;
    }>): {
        fetch: (userId: string, force?: boolean) => Promise<GuildBan>;
        list: (query?: RESTGetAPIGuildBansQuery, force?: boolean) => Promise<GuildBan[]>;
        create: (memberId: string, body?: Parameters<BanShorter["create"]>[2], reason?: string) => Promise<void>;
        remove: (memberId: string, reason?: string) => Promise<void>;
        bulkCreate: (body: Parameters<BanShorter["bulkCreate"]>[1], reason?: string) => Promise<import("discord-api-types/v10").RESTPostAPIGuildBulkBanResult>;
    };
}
