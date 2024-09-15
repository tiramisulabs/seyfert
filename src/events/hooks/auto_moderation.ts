import { Transformers } from '../../client/transformers';
import type { UsingClient } from '../../commands';
import { toCamelCase } from '../../common';
import type {
	GatewayAutoModerationActionExecutionDispatchData,
	GatewayAutoModerationRuleCreateDispatchData,
	GatewayAutoModerationRuleDeleteDispatchData,
	GatewayAutoModerationRuleUpdateDispatchData,
} from '../../types';

export const AUTO_MODERATION_ACTION_EXECUTION = (
	_self: UsingClient,
	data: GatewayAutoModerationActionExecutionDispatchData,
) => {
	return toCamelCase(data);
};

export const AUTO_MODERATION_RULE_CREATE = (self: UsingClient, data: GatewayAutoModerationRuleCreateDispatchData) => {
	return Transformers.AutoModerationRule(self, data);
};

export const AUTO_MODERATION_RULE_DELETE = (self: UsingClient, data: GatewayAutoModerationRuleDeleteDispatchData) => {
	return Transformers.AutoModerationRule(self, data);
};

export const AUTO_MODERATION_RULE_UPDATE = (self: UsingClient, data: GatewayAutoModerationRuleUpdateDispatchData) => {
	return Transformers.AutoModerationRule(self, data);
};
