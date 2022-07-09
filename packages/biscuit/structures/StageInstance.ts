import type { Model } from "./Base.ts";
import type { Session } from "../Session.ts";
import type { Snowflake } from "../Snowflake.ts";
import type { DiscordStageInstance as DiscordAutoClosingStageInstance } from "../../discordeno/mod.ts";
import * as Routes from "../Routes.ts";

export interface DiscordStageInstance extends DiscordAutoClosingStageInstance {
    privacy_level: PrivacyLevels;
    discoverable_disabled: boolean;
    guild_scheduled_event_id: Snowflake;
}

export enum PrivacyLevels {
    Public = 1,
    GuildOnly = 2,
}

export class StageInstance implements Model {
    constructor(session: Session, data: DiscordStageInstance) {
        this.session = session;
        this.id = data.id;
        this.channelId = data.channel_id;
        this.guildId = data.guild_id;
        this.topic = data.topic;
        this.privacyLevel = data.privacy_level;
        this.discoverableDisabled = data.discoverable_disabled;
        this.guildScheduledEventId = data.guild_scheduled_event_id;
    }

    readonly session: Session;
    readonly id: Snowflake;

    channelId: Snowflake;
    guildId: Snowflake;
    topic: string;

    // TODO: see if this works
    privacyLevel: PrivacyLevels;
    discoverableDisabled: boolean;
    guildScheduledEventId: Snowflake;

    async edit(options: { topic?: string; privacyLevel?: PrivacyLevels }) {
        const stageInstance = await this.session.rest.runMethod<DiscordStageInstance>(
            this.session.rest,
            "PATCH",
            Routes.STAGE_INSTANCE(this.id),
            {
                topic: options.topic,
                privacy_level: options.privacyLevel,
            },
        );

        return new StageInstance(this.session, stageInstance);
    }

    async delete() {
        await this.session.rest.runMethod<undefined>(this.session.rest, "DELETE", Routes.STAGE_INSTANCE(this.id));
    }
}

export default StageInstance;
