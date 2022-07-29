import type { Model } from './base';
import type { Session } from '../biscuit';
import type { Snowflake } from '../snowflakes';
import type {
	AutoModerationActionType,
	AutoModerationEventTypes,
	AutoModerationTriggerTypes,
	DiscordAutoModerationRule,
	DiscordAutoModerationRuleTriggerMetadataPresets,
	DiscordAutoModerationActionExecution,
} from '@biscuitland/api-types';

export interface AutoModerationRuleTriggerMetadata {
	keywordFilter?: string[];
	presets?: DiscordAutoModerationRuleTriggerMetadataPresets[];
}

export interface ActionMetadata {
	channelId: Snowflake;
	durationSeconds: number;
}

export interface AutoModerationAction {
	type: AutoModerationActionType;
	metadata: ActionMetadata;
}

export class AutoModerationRule implements Model {
	constructor(session: Session, data: DiscordAutoModerationRule) {
		this.session = session;
		this.id = data.id;
		this.guildId = data.guild_id;
		this.name = data.name;
		this.creatorId = data.creator_id;
		this.eventType = data.event_type;
		this.triggerType = data.trigger_type;
		this.triggerMetadata = {
			keywordFilter: data.trigger_metadata.keyword_filter,
			presets: data.trigger_metadata.presets,
		};
		this.actions = data.actions.map(action =>
			Object.create({
				type: action.type,
				metadata: {
					channelId: action.metadata.channel_id,
					durationSeconds: action.metadata.duration_seconds,
				},
			})
		);
		this.enabled = !!data.enabled;
		this.exemptRoles = data.exempt_roles;
		this.exemptChannels = data.exempt_channels;
	}

	session: Session;
	id: Snowflake;
	guildId: Snowflake;
	name: string;
	creatorId: Snowflake;
	eventType: AutoModerationEventTypes;
	triggerType: AutoModerationTriggerTypes;
	triggerMetadata: AutoModerationRuleTriggerMetadata;
	actions: AutoModerationAction[];
	enabled: boolean;
	exemptRoles: Snowflake[];
	exemptChannels: Snowflake[];
}

export class AutoModerationExecution {
	constructor(session: Session, data: DiscordAutoModerationActionExecution) {
		this.session = session;
		this.guildId = data.guild_id;
		this.action = Object.create({
			type: data.action.type,
			metadata: {
				channelId: data.action.metadata.channel_id,
				durationSeconds: data.action.metadata.duration_seconds,
			},
		});
		this.ruleId = data.rule_id;
		this.ruleTriggerType = data.rule_trigger_type;
		this.userId = data.user_id;
		this.content = data.content;
		if (data.channel_id) {
			this.channelId = data.channel_id;
		}
		if (data.message_id) {
			this.messageId = data.message_id;
		}
		if (data.alert_system_message_id) {
			this.alertSystemMessageId = data.alert_system_message_id;
		}

		if (data.matched_keyword) {
			this.matchedKeyword = data.matched_keyword;
		}

		if (data.matched_content) {
			this.matched_content = data.matched_content;
		}
	}

	session: Session;
	guildId: Snowflake;
	action: AutoModerationAction;
	ruleId: Snowflake;
	ruleTriggerType: AutoModerationTriggerTypes;
	userId: Snowflake;
	channelId?: Snowflake;
	messageId?: Snowflake;
	alertSystemMessageId?: Snowflake;
	content?: string;
	matchedKeyword?: string;
	matched_content?: string;
}
