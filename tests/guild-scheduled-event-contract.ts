import {
	type Client,
	GuildScheduledEventEntityType,
	GuildScheduledEventRecurrenceRuleFrequency,
	type GuildScheduledEventStructure,
	type RESTPatchAPIGuildScheduledEventJSONBody,
	type RESTPostAPIGuildScheduledEventJSONBody,
} from 'seyfert';
import type { GUILD_SCHEDULED_EVENT_CREATE, GUILD_SCHEDULED_EVENT_UPDATE, GUILD_SCHEDULED_EVENT_DELETE } from '../lib/events/hooks/guild';

declare function expectType<T>(value: T): void;
declare const event: GuildScheduledEventStructure;
declare const client: Client;
declare const created: ReturnType<typeof GUILD_SCHEDULED_EVENT_CREATE>;
declare const updated: ReturnType<typeof GUILD_SCHEDULED_EVENT_UPDATE>;
declare const deleted: ReturnType<typeof GUILD_SCHEDULED_EVENT_DELETE>;

for (const item of [event, created, updated, deleted]) {
	if (item.entityType === GuildScheduledEventEntityType.External) {
		expectType<string>(item.entityMetadata.location);
		expectType<null>(item.channelId);
	} else {
		expectType<string>(item.channelId);
		expectType<null>(item.entityMetadata);
	}
}
client.guilds.events.fetch('guild', 'event').then(item => {
	if (item.entityType === GuildScheduledEventEntityType.External) {
		expectType<string>(item.entityMetadata.location);
	}
});

const createBody: RESTPostAPIGuildScheduledEventJSONBody = {
	name: 'weekly stage',
	privacy_level: 2,
	scheduled_start_time: '2026-09-01T10:00:00.000Z',
	entity_type: 1,
	channel_id: '111',
	recurrence_rule: {
		start: '2026-09-01T10:00:00.000Z',
		end: null,
		frequency: GuildScheduledEventRecurrenceRuleFrequency.Weekly,
		interval: 1,
		by_weekday: null,
		by_n_weekday: null,
		by_month: null,
		by_month_day: null,
		by_year_day: null,
		count: null,
	},
};
expectType<string>(createBody.name);

const editBody: RESTPatchAPIGuildScheduledEventJSONBody = {
	description: 'moved outdoors',
	entity_metadata: { location: 'central park' },
	channel_id: null,
	recurrence_rule: null,
};
expectType<RESTPatchAPIGuildScheduledEventJSONBody>(editBody);
expectType<RESTPatchAPIGuildScheduledEventJSONBody>({
	description: null,
	entity_metadata: null,
	recurrence_rule: null,
});
