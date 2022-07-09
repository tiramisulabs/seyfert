import { AutoModerationTriggerTypes, DiscordAutoModerationActionExecution } from "../../discordeno/mod.ts";
import type { Session } from "../Session.ts";
import type { Snowflake } from "../Snowflake.ts";
import { AutoModerationAction } from "./AutoModerationRule.ts";

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
