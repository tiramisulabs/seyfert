import type {
	GatewayAutoModerationActionExecutionDispatchData,
	GatewayAutoModerationRuleCreateDispatchData,
	GatewayAutoModerationRuleDeleteDispatchData,
	GatewayAutoModerationRuleUpdateDispatchData,
} from 'discord-api-types/v10';
import type { BaseClient } from '../../client/base';
import { toCamelCase } from '../../common';
import { AutoModerationRule } from '../../structures';

export const AUTO_MODERATION_ACTION_EXECUTION = (
	_self: BaseClient,
	data: GatewayAutoModerationActionExecutionDispatchData,
) => {
	return toCamelCase(data);
};

export const AUTO_MODERATION_RULE_CREATE = (self: BaseClient, data: GatewayAutoModerationRuleCreateDispatchData) => {
	return new AutoModerationRule(self, data);
};

export const AUTO_MODERATION_RULE_DELETE = (self: BaseClient, data: GatewayAutoModerationRuleDeleteDispatchData) => {
	return new AutoModerationRule(self, data);
};

export const AUTO_MODERATION_RULE_UPDATE = (self: BaseClient, data: GatewayAutoModerationRuleUpdateDispatchData) => {
	return new AutoModerationRule(self, data);
};
