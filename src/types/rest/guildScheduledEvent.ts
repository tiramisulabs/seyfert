import type { Snowflake } from '..';
import type {
	APIGuildScheduledEvent,
	APIGuildScheduledEventEntityMetadata,
	APIGuildScheduledEventRecurrenceRule,
	APIGuildScheduledEventUser,
	GuildScheduledEventEntityType,
	GuildScheduledEventPrivacyLevel,
	GuildScheduledEventStatus,
} from '../payloads';
import type { StrictPartial } from '../utils';

/**
 * https://docs.discord.com/developers/resources/guild-scheduled-event#list-scheduled-events-for-guild
 */
export interface RESTGetAPIGuildScheduledEventsQuery {
	/**
	 * Whether to include number of users subscribed to each event
	 */
	with_user_count?: boolean;
}

/**
 * https://docs.discord.com/developers/resources/guild-scheduled-event#list-scheduled-events-for-guild
 */
export type RESTGetAPIGuildScheduledEventsResult = APIGuildScheduledEvent[];

/**
 * https://docs.discord.com/developers/resources/guild-scheduled-event#create-guild-scheduled-event
 */
export interface RESTPostAPIGuildScheduledEventJSONBody {
	/**
	 * The stage channel id of the guild event
	 */
	channel_id?: Snowflake | undefined;
	/**
	 * The name of the guild event
	 */
	name: string;
	/**
	 * The privacy level of the guild event
	 */
	privacy_level: GuildScheduledEventPrivacyLevel;
	/**
	 * The definition for how often this event should recur
	 *
	 * https://docs.discord.com/developers/resources/guild-scheduled-event#create-guild-scheduled-event-json-params
	 */
	recurrence_rule?: APIGuildScheduledEventRecurrenceRule | undefined;
	/**
	 * The time to schedule the guild event at
	 */
	scheduled_start_time: string;
	/**
	 * The time when the scheduled event is scheduled to end
	 */
	scheduled_end_time?: string | undefined;
	/**
	 * The description of the guild event
	 */
	description?: string | undefined;
	/**
	 * The scheduled entity type of the guild event
	 */
	entity_type?: GuildScheduledEventEntityType | undefined;
	/**
	 * The entity metadata of the scheduled event
	 */
	entity_metadata?: APIGuildScheduledEventEntityMetadata | undefined;
	/**
	 * The cover image of the scheduled event
	 */
	image?: string | null | undefined;
}

/**
 * https://docs.discord.com/developers/resources/guild-scheduled-event#create-guild-scheduled-event
 */
export type RESTPostAPIGuildScheduledEventResult = APIGuildScheduledEvent;

/**
 * https://docs.discord.com/developers/resources/guild-scheduled-event#get-guild-scheduled-event
 */
export interface RESTGetAPIGuildScheduledEventQuery {
	/**
	 * Whether to include number of users subscribed to this event
	 */
	with_user_count?: boolean;
}

/**
 * https://docs.discord.com/developers/resources/guild-scheduled-event#get-guild-scheduled-event
 */
export type RESTGetAPIGuildScheduledEventResult = APIGuildScheduledEvent;

/**
 * https://docs.discord.com/developers/resources/guild-scheduled-event#modify-guild-scheduled-event
 */
export interface RESTPatchAPIGuildScheduledEventJSONBody
	extends StrictPartial<
		Omit<RESTPostAPIGuildScheduledEventJSONBody, 'channel_id' | 'entity_metadata' | 'description' | 'recurrence_rule'>
	> {
	/**
	 * The channel id in which the scheduled event will be hosted, or `null` when moving to `EXTERNAL`.
	 *
	 * https://docs.discord.com/developers/resources/guild-scheduled-event#modify-guild-scheduled-event-json-params
	 */
	channel_id?: Snowflake | null | undefined;
	/**
	 * The entity metadata of the scheduled event.
	 *
	 * Discord silently discards this field for non-`EXTERNAL` events.
	 *
	 * https://docs.discord.com/developers/resources/guild-scheduled-event#modify-guild-scheduled-event-json-params
	 */
	entity_metadata?: APIGuildScheduledEventEntityMetadata | null | undefined;
	/**
	 * The description of the guild event.
	 *
	 * https://docs.discord.com/developers/resources/guild-scheduled-event#modify-guild-scheduled-event-json-params
	 */
	description?: string | null | undefined;
	/**
	 * The definition for how often this event should recur, or `null` to clear it.
	 *
	 * https://docs.discord.com/developers/resources/guild-scheduled-event#modify-guild-scheduled-event-json-params
	 */
	recurrence_rule?: APIGuildScheduledEventRecurrenceRule | null | undefined;
	/**
	 * The status of the scheduled event
	 */
	status?: GuildScheduledEventStatus | undefined;
}

/**
 * https://docs.discord.com/developers/resources/guild-scheduled-event#modify-guild-scheduled-event
 */
export type RESTPatchAPIGuildScheduledEventResult = APIGuildScheduledEvent;

/**
 * https://docs.discord.com/developers/resources/guild-scheduled-event#delete-guild-scheduled-event
 */
export type RESTDeleteAPIGuildScheduledEventResult = undefined;

/**
 * https://docs.discord.com/developers/resources/guild-scheduled-event#get-guild-scheduled-event-users
 */
export interface RESTGetAPIGuildScheduledEventUsersQuery {
	/**
	 * Number of users to receive from the event
	 *
	 * @default 100
	 */
	limit?: number;
	/**
	 * Whether to include guild member data if it exists
	 */
	with_member?: boolean;
	/**
	 * Consider only users before given user id
	 */
	before?: Snowflake;
	/**
	 * Consider only users after given user id
	 */
	after?: Snowflake;
}

/**
 * https://docs.discord.com/developers/resources/guild-scheduled-event#get-guild-scheduled-event-users
 */
export type RESTGetAPIGuildScheduledEventUsersResult = APIGuildScheduledEventUser[];
