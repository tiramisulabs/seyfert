import type { APISticker, RESTPatchAPIGuildStickerJSONBody, RESTPostAPIGuildStickerFormDataBody } from 'discord-api-types/v10';
import type { RawFile, UsingClient } from '..';
import type { Attachment, AttachmentBuilder } from '../builders';
import type { MethodContext, ObjectToLower } from '../common';
import { DiscordBase } from './extra/DiscordBase';
import { type UserStructure } from '../client/transformers';
export interface Sticker extends DiscordBase, ObjectToLower<Omit<APISticker, 'user'>> {
}
export declare class Sticker extends DiscordBase {
    user?: UserStructure;
    constructor(client: UsingClient, data: APISticker);
    guild(force?: boolean): Promise<import("./Guild").Guild<"api">> | undefined;
    edit(body: RESTPatchAPIGuildStickerJSONBody, reason?: string): Promise<Sticker> | undefined;
    fetch(force?: boolean): Promise<Sticker> | undefined;
    delete(reason?: string): Promise<void> | undefined;
    static methods({ client, guildId }: MethodContext<{
        guildId: string;
    }>): {
        list: () => Promise<Sticker[]>;
        create: (payload: CreateStickerBodyRequest, reason?: string) => Promise<Sticker>;
        edit: (stickerId: string, body: RESTPatchAPIGuildStickerJSONBody, reason?: string) => Promise<Sticker>;
        fetch: (stickerId: string, force?: boolean) => Promise<Sticker>;
        delete: (stickerId: string, reason?: string) => Promise<void>;
    };
}
export interface CreateStickerBodyRequest extends Omit<RESTPostAPIGuildStickerFormDataBody, 'file'> {
    file: Attachment | AttachmentBuilder | RawFile;
}
