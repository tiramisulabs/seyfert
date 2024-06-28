import type { APIEmoji, RESTPatchAPIChannelJSONBody, RESTPatchAPIGuildEmojiJSONBody } from 'discord-api-types/v10';
import type { BaseCDNUrlOptions } from '../api';
import type { UsingClient } from '../commands';
import { type EmojiShorter, type MethodContext, type ObjectToLower } from '../common';
import { DiscordBase } from './extra/DiscordBase';
export interface GuildEmoji extends DiscordBase, ObjectToLower<Omit<APIEmoji, 'id'>> {
}
export declare class GuildEmoji extends DiscordBase {
    readonly guildId: string;
    constructor(client: UsingClient, data: APIEmoji, guildId: string);
    guild(force?: boolean): Promise<import("./Guild").Guild<"api">> | undefined;
    edit(body: RESTPatchAPIChannelJSONBody, reason?: string): Promise<GuildEmoji>;
    delete(reason?: string): Promise<void>;
    fetch(force?: boolean): Promise<GuildEmoji>;
    url(options?: BaseCDNUrlOptions): string;
    toString(): string;
    toJSON(): {
        id: string;
        name: string | null;
        animated: boolean;
    };
    static methods({ client, guildId }: MethodContext<{
        guildId: string;
    }>): {
        edit: (emojiId: string, body: RESTPatchAPIGuildEmojiJSONBody, reason?: string) => Promise<GuildEmoji>;
        create: (body: Parameters<EmojiShorter["create"]>[1]) => Promise<GuildEmoji>;
        fetch: (emojiId: string, force?: boolean) => Promise<GuildEmoji>;
        list: (force?: boolean) => Promise<GuildEmoji[]>;
    };
}
