import { type Client, GuildScheduledEventEntityType, type GuildScheduledEventStructure } from 'seyfert';
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
