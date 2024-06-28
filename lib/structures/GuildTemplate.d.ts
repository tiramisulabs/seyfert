import type { APITemplate, RESTPatchAPIGuildTemplateJSONBody, RESTPostAPIGuildTemplatesJSONBody } from 'discord-api-types/v10';
import type { UsingClient } from '../commands';
import type { MethodContext, ObjectToLower } from '../common';
import { Base } from './extra/Base';
export interface GuildTemplate extends Base, ObjectToLower<APITemplate> {
}
export declare class GuildTemplate extends Base {
    constructor(client: UsingClient, data: APITemplate);
    guild(force?: boolean): Promise<import("./Guild").Guild<"api">>;
    fetch(): Promise<GuildTemplate>;
    sync(): Promise<GuildTemplate>;
    edit(body: RESTPatchAPIGuildTemplateJSONBody): Promise<GuildTemplate>;
    delete(): Promise<GuildTemplate>;
    static methods(ctx: MethodContext<{
        guildId: string;
    }>): {
        fetch: (code: string) => Promise<GuildTemplate>;
        list: () => Promise<GuildTemplate[]>;
        create: (body: RESTPostAPIGuildTemplatesJSONBody) => Promise<GuildTemplate>;
        sync: (code: string) => Promise<GuildTemplate>;
        edit: (code: string, body: RESTPatchAPIGuildTemplateJSONBody) => Promise<GuildTemplate>;
        delete: (code: string) => Promise<GuildTemplate>;
    };
}
