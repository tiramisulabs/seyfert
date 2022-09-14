import type { Model } from './base';
import type { Session } from '../biscuit';
import type { Snowflake } from '../snowflakes';
import type {
	AutoModerationActionType,
	AutoModerationEventTypes,
	AutoModerationTriggerTypes,
	DiscordAutoModerationRule,
	DiscordAutoModerationRuleTriggerMetadataPresets,
	DiscordAutoModerationActionExecution
} from '@biscuitland/api-types';
import {
	AUTO_MODERATION_RULES
} from '@biscuitland/api-types';

export interface AutoModerationRuleTriggerMetadata {
	keywordFilter?: string[];
	presets?: DiscordAutoModerationRuleTriggerMetadataPresets[];
	allowList?: string[];
}

export interface ActionMetadata {
	channelId?: Snowflake;
	durationSeconds?: number;
}

export interface AutoModerationAction {
	type: AutoModerationActionType;
	metadata: ActionMetadata;
}

/** @link https://discord.com/developers/docs/resources/auto-moderation#create-auto-moderation-rule-json-params */
export interface CreateAutoModerationRule {
	name: string;
	eventType: 1;
	triggerType: AutoModerationTriggerTypes;
	triggerMetadata?: AutoModerationRuleTriggerMetadata;
	actions: AutoModerationAction[];
	enabled?: boolean;
	exemptRoles?: Snowflake[];
	exemptChannels?: Snowflake[];
	reason?: string;
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
			allowList: data.trigger_metadata.allow_list
		};
		this.actions = data.actions.map(action => {
			return {
				type: action.type,
				metadata: {
					channelId: action.metadata.channel_id,
					durationSeconds: action.metadata.duration_seconds
				}
			};
		});
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

	async getRules(
		ruleId?: Snowflake
	): Promise<AutoModerationRule | AutoModerationRule[]> {
		const request = await this.session.rest.get<
			DiscordAutoModerationRule | DiscordAutoModerationRule[]
		>(AUTO_MODERATION_RULES(this.guildId, ruleId));
		if (Array.isArray(request)) {
			return request.map(
				amr => new AutoModerationRule(this.session, amr)
			);
		}
		return new AutoModerationRule(this.session, request);
	}

	async createRule(options: CreateAutoModerationRule) {
		const request = await this.session.rest.post<DiscordAutoModerationRule>(
			AUTO_MODERATION_RULES(this.guildId),
			{
				name: options.name,
				event_type: options.eventType,
				trigger_type: options.triggerType,
				trigger_metadata: options.triggerMetadata,
				actions: options.actions
					? options.actions.map(x => {
						return {
							type: x.type,
							metadata: {
								channel_id: x.metadata.channelId,
								duration_seconds:
									x.metadata.durationSeconds
							}
						};
					})
					: undefined,
				enabled: !!options.enabled,
				exempt_roles: options.exemptRoles,
				exempt_channels: options.exemptChannels
			}, { headers: { 'X-Audit-Log-Reason': options.reason ?? '' } }
		);
		return new AutoModerationRule(this.session, request);
	}

	async editRule(
		ruleId = this.id,
		options: Partial<CreateAutoModerationRule>
	) {
		const request = await this.session.rest.patch<
			DiscordAutoModerationRule
		>(AUTO_MODERATION_RULES(this.guildId, ruleId), {
			name: options.name,
			event_type: options.eventType,
			trigger_type: options.triggerType,
			trigger_metadata: options.triggerMetadata,
			actions: options.actions
				? options.actions.map(x => {
					return {
						type: x.type,
						metadata: {
							channel_id: x.metadata.channelId,
							duration_seconds: x.metadata.durationSeconds
						}
					};
				}
				)
				: undefined,
			enabled: !!options.enabled,
			exempt_roles: options.exemptRoles,
			exempt_channels: options.exemptChannels
		}, { headers: { 'X-Audit-Log-Reason': options.reason ?? '' } }
		);
		return new AutoModerationRule(this.session, request);
	}

	async deleteRule(ruleId = this.id, reason?: string): Promise<void> {
		await this.session.rest.delete(
			AUTO_MODERATION_RULES(this.guildId, ruleId), {},
			{ headers: { 'X-Audit-Log-Reason': reason ?? '' } }
		);
		return;
	}
}

export class AutoModerationExecution {
	constructor(session: Session, data: DiscordAutoModerationActionExecution) {
		this.session = session;
		this.guildId = data.guild_id;
		this.action = {
			type: data.action.type,
			metadata: {
				channelId: data.action.metadata.channel_id as string,
				durationSeconds: data.action.metadata.duration_seconds as number
			}
		};
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
