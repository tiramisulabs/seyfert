import type { Model } from './base';
import type { Session } from '../biscuit';
import type { Snowflake } from '../snowflakes';
import type { DiscordStageInstance as DiscordAutoClosingStageInstance } from '@biscuitland/api-types';
import { STAGE_INSTANCE } from '@biscuitland/api-types';

export interface DiscordStageInstanceB extends DiscordAutoClosingStageInstance {
	privacy_level: PrivacyLevels;
	discoverable_disabled: boolean;
	guild_scheduled_event_id: Snowflake;
}

export enum PrivacyLevels {
	Public = 1,
	GuildOnly = 2,
}

export type StageEditOptions = {
	topic?: string;
	privacy?: PrivacyLevels;
};

export class StageInstance implements Model {
	constructor(session: Session, data: DiscordStageInstanceB) {
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

	async edit(options: StageEditOptions): Promise<StageInstance> {
		const stageInstance =
			await this.session.rest.patch<DiscordStageInstanceB>(
				STAGE_INSTANCE(this.id),
				{
					topic: options.topic,
					privacy_level: options.privacy,
				}
			);

		return new StageInstance(this.session, stageInstance);
	}

	async delete(): Promise<void> {
		await this.session.rest.delete<undefined>(STAGE_INSTANCE(this.id), {});
	}
}
