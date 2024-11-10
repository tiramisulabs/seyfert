import type { APIGuild } from './guild';
import type { ApplicationIntegrationType } from './interactions';
import type { APIEntitlement } from './monetization';
import type { OAuth2Scopes } from './oauth2';
import type { APIUser } from './user';

/**
 * https://discord.com/developers/docs/events/webhook-events#payload-structure
 */
export interface WebhookEventPayload<WET extends WebhookEventTypes = WebhookEventTypes> {
	/** Version scheme for the webhook event */
	version: 1;
	/**	ID of your app */
	application_id: string;
	/**	Type of webhook, either 0 for PING or 1 for webhook events */
	type: WET;
	/**	Event data payload */
	event: EventBodyObject<WET>;
}

export type EventBodyObjectData<T extends WebhookEventTypes> = T extends WebhookEventTypes.ApplicationAuthorized
	? ApplicationAuthorizedEvent
	: APIEntitlement;

/**
 * https://discord.com/developers/docs/events/webhook-events#event-body-object
 */
export interface EventBodyObject<T extends WebhookEventTypes = WebhookEventTypes> {
	/** Event type */
	type: T;
	/** Timestamp of when the event occurred in ISO8601 format */
	timestamp: string;
	/** Data for the event. The shape depends on the event type */
	data?: EventBodyObjectData<T>;
}

/**
 * https://discord.com/developers/docs/events/webhook-events#application-authorized-application-authorized-structure
 */
export interface ApplicationAuthorizedEvent {
	/** Installation context for the authorization. Either guild (0) if installed to a server or user (1) if installed to a user's account */
	integration_type?: ApplicationIntegrationType;
	/** User who authorized the app */
	user: APIUser;
	/** List of scopes the user authorized */
	scopes: `${OAuth2Scopes}`[];
	/**	Server which app was authorized for (when integration type is 0) */
	guild?: APIGuild;
}

/**
 * https://discord.com/developers/docs/events/webhook-events#webhook-types
 */
export enum WebhookRequestType {
	/** PING event sent to verify your Webhook Event URL is active */
	PING = 0,
	/** Webhook event (details for event in event body object) */
	Event = 1,
}

/**
 * https://discord.com/developers/docs/events/webhook-events#event-types
 */
export enum WebhookEventTypes {
	/** Sent when an app was authorized by a user to a server or their account */
	ApplicationAuthorized = 'APPLICATION_AUTHORIZED',
	/** Entitlement was created */
	EntitlementCreate = 'ENTITLEMENT_CREATE',
	/**
	 * User was added to a Quest (currently unavailable)
	 * @unstable
	 */
	QuestUserEnrollment = 'QUEST_USER_ENROLLMENT',
}
