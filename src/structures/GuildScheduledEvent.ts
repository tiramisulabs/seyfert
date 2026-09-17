import type { BaseCDNUrlOptions } from '../api';
import type { ReturnCache } from '../cache';
import {
	type GuildMemberStructure,
	type GuildScheduledEventStructure,
	type GuildScheduledSubscriberStructure,
	type GuildStructure,
	Transformers,
	type UserStructure,
} from '../client/transformers';
import type { UsingClient } from '../commands';
import type { MethodContext, ObjectToLower } from '../common';
import type {
	APIGuildScheduledEvent,
	APIGuildScheduledEventUser,
	RESTGetAPIGuildScheduledEventQuery,
	RESTGetAPIGuildScheduledEventsQuery,
	RESTGetAPIGuildScheduledEventUsersQuery,
	RESTPatchAPIGuildScheduledEventJSONBody,
	RESTPostAPIGuildScheduledEventJSONBody,
} from '../types';
import { GuildScheduledEventEntityType } from '../types';
import { DiscordBase } from './extra/DiscordBase';

/**
 * A subscriber of a guild scheduled event.
 *
 * Discord exposes event subscribers as `{ guild_scheduled_event_id, user, member? }` rows.
 * This structure keeps those rows addressable without forcing a full member fetch.
 *
 * https://docs.discord.com/developers/resources/guild-scheduled-event#guild-scheduled-event-user-object-guild-scheduled-event-user-structure
 */
export interface GuildScheduledSubscriber
	extends DiscordBase,
		ObjectToLower<Omit<APIGuildScheduledEventUser, 'user' | 'member' | 'guild_scheduled_event_id'>> {
	eventId: string;
	user: UserStructure;
	member?: GuildMemberStructure;
}

export class GuildScheduledSubscriber extends DiscordBase {
	user!: UserStructure;
	member?: GuildMemberStructure;
	constructor(
		client: UsingClient,
		data: APIGuildScheduledEventUser,
		readonly guildId: string,
	) {
		super(client, { ...data, id: data.user.id });
		this.eventId = data.guild_scheduled_event_id;
		this.user = Transformers.User(client, data.user);
		if (data.member) {
			this.member = Transformers.GuildMember(client, data.member, data.user, guildId);
		}
	}
}

/**
 * Represents a Discord guild scheduled event.
 *
 * The REST routes already existed, but the payloads were only returned as raw
 * camel-cased objects from gateway hooks. This structure centralizes date
 * parsing, lifecycle helpers, subscriber listing, and guild-scoped CRUD.
 *
 * https://docs.discord.com/developers/resources/guild-scheduled-event#guild-scheduled-event-object-guild-scheduled-event-structure
 */
export interface GuildScheduledEvent extends DiscordBase, ObjectToLower<Omit<APIGuildScheduledEvent, 'creator'>> {}

export class GuildScheduledEvent extends DiscordBase<APIGuildScheduledEvent> {
	creator?: UserStructure;
	constructor(client: UsingClient, data: APIGuildScheduledEvent) {
		super(client, data);
		if (data.creator) {
			this.creator = Transformers.User(client, data.creator);
		}
	}

	/**
	 * The start time of the event as a `Date`.
	 */
	get startAt(): Date | undefined {
		return this.scheduledStartTime ? new Date(this.scheduledStartTime) : undefined;
	}

	/**
	 * The end time of the event as a `Date`, when Discord provides one.
	 */
	get endAt(): Date | undefined {
		return this.scheduledEndTime ? new Date(this.scheduledEndTime) : undefined;
	}

	/**
	 * Whether the event takes place outside Discord (no channel).
	 */
	get isExternal(): boolean {
		return this.entityType === GuildScheduledEventEntityType.External;
	}

	/**
	 * CDN URL for the event cover image, when the event has one.
	 */
	coverURL(options?: BaseCDNUrlOptions): string | undefined {
		if (!this.image) return undefined;
		return this.rest.cdn['guild-events'](this.id).get(this.image, options);
	}

	guild(mode?: 'rest' | 'flow'): Promise<GuildStructure<'cached' | 'api'>>;
	guild(mode: 'cache'): ReturnCache<GuildStructure<'cached'> | undefined>;
	guild(mode: 'cache' | 'rest' | 'flow' = 'flow'): unknown {
		switch (mode) {
			case 'cache':
				return (
					this.client.cache.guilds?.get(this.guildId) ||
					(this.client.cache.adapter.isAsync ? (Promise.resolve() as never) : undefined)
				);
			default:
				return this.client.guilds.fetch(this.guildId, mode === 'rest');
		}
	}

	/**
	 * Refetches this event from Discord.
	 */
	fetch(query?: RESTGetAPIGuildScheduledEventQuery): Promise<GuildScheduledEventStructure> {
		return this.client.guilds.events.fetch(this.guildId, this.id, query);
	}

	/**
	 * Lists users subscribed to this event.
	 */
	subscribers(query?: RESTGetAPIGuildScheduledEventUsersQuery): Promise<GuildScheduledSubscriberStructure[]> {
		return this.client.guilds.events.subscribers(this.guildId, this.id, query);
	}

	/**
	 * Edits this event.
	 */
	edit(body: RESTPatchAPIGuildScheduledEventJSONBody, reason?: string): Promise<GuildScheduledEventStructure> {
		return this.client.guilds.events.edit(this.guildId, this.id, body, reason);
	}

	/**
	 * Deletes this event.
	 */
	delete(reason?: string) {
		return this.client.guilds.events.delete(this.guildId, this.id, reason);
	}

	static methods({ client, guildId }: MethodContext<{ guildId: string }>) {
		return {
			list: (query?: RESTGetAPIGuildScheduledEventsQuery): Promise<GuildScheduledEventStructure[]> =>
				client.guilds.events.list(guildId, query),
			create: (body: RESTPostAPIGuildScheduledEventJSONBody, reason?: string): Promise<GuildScheduledEventStructure> =>
				client.guilds.events.create(guildId, body, reason),
			fetch: (eventId: string, query?: RESTGetAPIGuildScheduledEventQuery): Promise<GuildScheduledEventStructure> =>
				client.guilds.events.fetch(guildId, eventId, query),
			edit: (
				eventId: string,
				body: RESTPatchAPIGuildScheduledEventJSONBody,
				reason?: string,
			): Promise<GuildScheduledEventStructure> => client.guilds.events.edit(guildId, eventId, body, reason),
			delete: (eventId: string, reason?: string) => client.guilds.events.delete(guildId, eventId, reason),
			subscribers: (
				eventId: string,
				query?: RESTGetAPIGuildScheduledEventUsersQuery,
			): Promise<GuildScheduledSubscriberStructure[]> => client.guilds.events.subscribers(guildId, eventId, query),
		};
	}
}
