import type { GatewayAutoModerationActionExecutionDispatchData, GatewayAutoModerationRuleCreateDispatchData, GatewayAutoModerationRuleDeleteDispatchData, GatewayAutoModerationRuleUpdateDispatchData } from 'discord-api-types/v10';
import type { UsingClient } from '../../commands';
export declare const AUTO_MODERATION_ACTION_EXECUTION: (_self: UsingClient, data: GatewayAutoModerationActionExecutionDispatchData) => {
    guildId: string;
    action: {
        type: import("discord-api-types/v10").AutoModerationActionType;
        metadata?: {
            channelId?: string | undefined;
            durationSeconds?: number | undefined;
            customMessage?: string | undefined;
        } | undefined;
    };
    ruleId: string;
    ruleTriggerType: import("discord-api-types/v10").AutoModerationRuleTriggerType;
    userId: string;
    channelId?: string | undefined;
    messageId?: string | undefined;
    alertSystemMessageId?: string | undefined;
    content: string;
    matchedKeyword: string | null;
    matchedContent: string | null;
};
export declare const AUTO_MODERATION_RULE_CREATE: (self: UsingClient, data: GatewayAutoModerationRuleCreateDispatchData) => import("../..").AutoModerationRule;
export declare const AUTO_MODERATION_RULE_DELETE: (self: UsingClient, data: GatewayAutoModerationRuleDeleteDispatchData) => import("../..").AutoModerationRule;
export declare const AUTO_MODERATION_RULE_UPDATE: (self: UsingClient, data: GatewayAutoModerationRuleUpdateDispatchData) => import("../..").AutoModerationRule;
