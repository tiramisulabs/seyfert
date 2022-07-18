import {
    AutoModerationActionType,
    AutoModerationEventTypes,
    AutoModerationTriggerTypes,
    DiscordAutoModerationRule,
    DiscordAutoModerationRuleTriggerMetadataPresets,
} from '../../discordeno/mod.ts';
import { Model } from './Base.ts';
import type { Session } from '../Session.ts';
import type { Snowflake } from '../Snowflake.ts';

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
        this.actions = data.actions.map((action) =>
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
