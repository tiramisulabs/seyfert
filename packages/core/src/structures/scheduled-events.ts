import type { Model } from './base';
import type { Snowflake } from '../snowflakes';
import type { Session } from '../biscuit';
import type {
	DiscordScheduledEvent,
	DiscordScheduledEventEntityMetadata,
	ScheduledEventEntityType,
	ScheduledEventStatus,
} from '@biscuitland/api-types';
import { PrivacyLevels } from './stage-instance';
import { User } from './user';

export class ScheduledEvent implements Model {
	constructor(session: Session, data: DiscordScheduledEvent) {
		this.session = session;
		this.id = data.id;
		this.guildId = data.guild_id;
		this.channelId = data.channel_id;
		this.creatorId = data.creator_id ? data.creator_id : undefined;
		this.name = data.name;
		this.description = data.description;
		this.scheduledStartTime = data.scheduled_start_time;
		this.scheduledEndTime = data.scheduled_end_time;
		this.privacyLevel = PrivacyLevels.GuildOnly;
		this.status = data.status;
		this.entityType = data.entity_type;
		this.entityMetadata = data.entity_metadata
			? data.entity_metadata
			: undefined;
		this.creator = data.creator
			? new User(session, data.creator)
			: undefined;
		this.userCount = data.user_count;
		this.image = data.image ? data.image : undefined;
	}

	session: Session;
	id: Snowflake;
	guildId: Snowflake;
	channelId: Snowflake | null;
	creatorId?: Snowflake;
	name: string;
	description?: string;
	scheduledStartTime: string;
	scheduledEndTime: string | null;
	privacyLevel: PrivacyLevels;
	status: ScheduledEventStatus;
	entityType: ScheduledEventEntityType;
	entityMetadata?: DiscordScheduledEventEntityMetadata;
	creator?: User;
	userCount?: number;
	image?: string;
}
