/**
 * Represents a Discord webhook.
 */
import type {
	APIWebhook,
	RESTGetAPIWebhookWithTokenMessageQuery,
	RESTPatchAPIWebhookJSONBody,
	RESTPatchAPIWebhookWithTokenJSONBody,
	RESTPostAPIWebhookWithTokenQuery,
} from 'discord-api-types/v10';
import type { UsingClient } from '../commands';
import type {
	ImageOptions,
	MessageWebhookCreateBodyRequest,
	MessageWebhookPayload,
	MessageWebhookUpdateBodyRequest,
	MethodContext,
	ObjectToLower,
} from '../common';
import { DiscordBase } from './extra/DiscordBase';
import { type AnonymousGuildStructure, Transformers, type UserStructure } from '../client/transformers';

export interface Webhook extends DiscordBase, ObjectToLower<Omit<APIWebhook, 'user' | 'source_guild'>> {}

/**
 * Represents a Discord webhook.
 */
export class Webhook extends DiscordBase {
	/** The user associated with the webhook, if applicable. */
	user?: UserStructure;
	/** The source guild of the webhook, if applicable. */
	sourceGuild?: Partial<AnonymousGuildStructure>;
	/** Methods related to interacting with messages through the webhook. */
	messages!: ReturnType<typeof Webhook.messages>;
	/**
	 * Constructs a new Webhook instance.
	 * @param client The Discord client instance.
	 * @param data The data representing the webhook.
	 */
	constructor(client: UsingClient, data: APIWebhook) {
		super(client, data);

		if (data.user) {
			this.user = Transformers.User(this.client, data.user);
		}

		if (data.source_guild) {
			this.sourceGuild = Transformers.AnonymousGuild(this.client, data.source_guild);
		}

		Object.assign(this, {
			messages: Webhook.messages({ client, webhookId: this.id, webhookToken: this.token! }),
		});
	}

	/**
	 * Fetches the guild associated with the webhook.
	 * @param force Whether to force fetching the guild even if it's already cached.
	 * @returns A promise that resolves to the guild associated with the webhook, or undefined if not applicable.
	 */
	guild(force = false) {
		if (!this.sourceGuild?.id) return;
		return this.client.guilds.fetch(this.sourceGuild.id, force);
	}

	/**
	 * Fetches the channel associated with the webhook.
	 * @param force Whether to force fetching the channel even if it's already cached.
	 * @returns A promise that resolves to the channel associated with the webhook, or undefined if not applicable.
	 */
	async channel(force = false) {
		if (!this.sourceChannel?.id) return;
		return this.client.channels.fetch(this.sourceChannel.id, force);
	}

	/**
	 * Retrieves the avatar URL of the webhook.
	 * @param options The image options for the avatar.
	 * @returns The avatar URL of the webhook, or null if no avatar is set.
	 */
	avatarURL(options?: ImageOptions): string | null {
		if (!this.avatar) {
			return null;
		}

		return this.rest.cdn.avatars(this.id).get(this.avatar, options);
	}

	/**
	 * Fetches the webhook data from the Discord API.
	 * @returns A promise that resolves to the fetched webhook data.
	 */
	async fetch() {
		return this.client.webhooks.fetch(this.id, this.token);
	}

	/**
	 * Edits the webhook.
	 * @param body The new webhook data.
	 * @param reason The reason for editing the webhook.
	 * @returns A promise that resolves when the webhook is successfully edited.
	 */
	async edit(body: RESTPatchAPIWebhookJSONBody | RESTPatchAPIWebhookWithTokenJSONBody, reason?: string) {
		return this.client.webhooks.edit(this.id, body, { reason, token: this.token });
	}

	/**
	 * Deletes the webhook.
	 * @param reason The reason for deleting the webhook.
	 * @returns A promise that resolves when the webhook is successfully deleted.
	 */
	delete(reason?: string) {
		return this.client.webhooks.delete(this.id, { token: this.token, reason });
	}

	/**
	 * Static methods related to interacting with messages through webhooks.
	 */
	static messages({ client, webhookId, webhookToken }: MethodContext<{ webhookId: string; webhookToken: string }>) {
		return {
			/** Writes a message through the webhook. */
			write: (payload: MessageWebhookMethodWriteParams) =>
				client.webhooks.writeMessage(webhookId, webhookToken, payload),
			/** Edits a message sent through the webhook. */
			edit: (payload: MessageWebhookMethodEditParams) => client.webhooks.editMessage(webhookId, webhookToken, payload),
			/** Deletes a message sent through the webhook. */
			delete: (messageId: string, reason?: string) =>
				client.webhooks.deleteMessage(webhookId, webhookToken, messageId, reason),
		};
	}

	/**
	 * Static methods related to managing webhooks.
	 */
	static methods({ client, webhookId, webhookToken }: MethodContext<{ webhookId: string; webhookToken?: string }>) {
		return {
			/** Deletes the webhook. */
			delete: (reason?: string) => client.webhooks.delete(webhookId, { reason, token: webhookToken }),
			/** Edits the webhook. */
			edit: (body: RESTPatchAPIWebhookWithTokenJSONBody | RESTPatchAPIWebhookJSONBody, reason?: string) =>
				client.webhooks.edit(webhookId, body, { token: webhookToken, reason }),
			/** Fetches the webhook data from the Discord API. */
			fetch: () => client.webhooks.fetch(webhookId, webhookToken),
		};
	}
}

/** Type definition for parameters of editing a message through a webhook. */
export type MessageWebhookMethodEditParams = MessageWebhookPayload<
	MessageWebhookUpdateBodyRequest,
	{ messageId: string; query?: RESTGetAPIWebhookWithTokenMessageQuery }
>;
/** Type definition for parameters of writing a message through a webhook. */
export type MessageWebhookMethodWriteParams = MessageWebhookPayload<
	MessageWebhookCreateBodyRequest,
	{ query?: RESTPostAPIWebhookWithTokenQuery }
>;
