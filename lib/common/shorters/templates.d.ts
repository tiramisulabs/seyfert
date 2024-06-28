import type { RESTPatchAPIGuildTemplateJSONBody, RESTPostAPIGuildTemplatesJSONBody } from 'discord-api-types/v10';
import { BaseShorter } from './base';
export declare class TemplateShorter extends BaseShorter {
    fetch(code: string): Promise<import("../..").GuildTemplate>;
    list(guildId: string): Promise<import("../..").GuildTemplate[]>;
    create(guildId: string, body: RESTPostAPIGuildTemplatesJSONBody): Promise<import("../..").GuildTemplate>;
    sync(guildId: string, code: string): Promise<import("../..").GuildTemplate>;
    edit(guildId: string, code: string, body: RESTPatchAPIGuildTemplateJSONBody): Promise<import("../..").GuildTemplate>;
    delete(guildId: string, code: string): Promise<import("../..").GuildTemplate>;
}
