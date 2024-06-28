import type { APIAutoModerationRule, RESTPatchAPIAutoModerationRuleJSONBody, RESTPostAPIAutoModerationRuleJSONBody } from 'discord-api-types/v10';
import type { UsingClient } from '../commands';
import { type MethodContext, type ObjectToLower } from '../common';
import { DiscordBase } from './extra/DiscordBase';
export interface AutoModerationRule extends ObjectToLower<APIAutoModerationRule> {
}
export declare class AutoModerationRule extends DiscordBase<APIAutoModerationRule> {
    constructor(client: UsingClient, data: APIAutoModerationRule);
    fetchCreator(force?: boolean): Promise<import("./GuildMember").GuildMember>;
    guild(force?: boolean): Promise<import("./Guild").Guild<"api">>;
    fetch(): Promise<AutoModerationRule>;
    edit(body: ObjectToLower<RESTPatchAPIAutoModerationRuleJSONBody>, reason?: string): Promise<AutoModerationRule>;
    delete(reason?: string): Promise<never>;
    static methods({ client, guildId }: MethodContext<{
        guildId: string;
    }>): {
        list: () => Promise<AutoModerationRule[]>;
        create: (body: RESTPostAPIAutoModerationRuleJSONBody) => Promise<AutoModerationRule>;
        delete: (ruleId: string, reason?: string) => Promise<never>;
        fetch: (ruleId: string) => Promise<AutoModerationRule>;
        edit: (ruleId: string, body: RESTPatchAPIAutoModerationRuleJSONBody, reason?: string) => Promise<AutoModerationRule>;
    };
}
