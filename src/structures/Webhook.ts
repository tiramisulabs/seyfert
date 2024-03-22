import type { UsingClient } from '../commands';
import type {
	APIWebhook,
	ImageOptions,
	MessageWebhookCreateBodyRequest,
	MessageWebhookPayload,
	MessageWebhookUpdateBodyRequest,
	MethodContext,
	ObjectToLower,
	RESTGetAPIWebhookWithTokenMessageQuery,
	RESTPatchAPIWebhookJSONBody,
	RESTPatchAPIWebhookWithTokenJSONBody,
	RESTPostAPIWebhookWithTokenQuery,
} from '../common';
import { AnonymousGuild } from './AnonymousGuild';
import { User } from './User';
import { DiscordBase } from './extra/DiscordBase';

export interface Webhook extends DiscordBase, ObjectToLower<Omit<APIWebhook, 'user' | 'source_guild'>> {}

export class Webhook extends DiscordBase {
	user?: User;
	sourceGuild?: Partial<AnonymousGuild>;
	messages!: ReturnType<typeof Webhook.messages>;
	constructor(client: UsingClient, data: APIWebhook) {
		super(client, data);

		if (data.user) {
			this.user = new User(this.client, data.user);
		}

		if (data.source_guild) {
			this.sourceGuild = new AnonymousGuild(this.client, data.source_guild);
		}

		Object.assign(this, {
			messages: Webhook.messages({ client, webhookId: this.id, webhookToken: this.token! }),
		});
	}

	guild(force = false) {
		if (!this.sourceGuild?.id) return;
		return this.client.guilds.fetch(this.sourceGuild.id, force);
	}

	async channel(force = false) {
		if (!this.sourceChannel?.id) return;
		return this.client.channels.fetch(this.sourceChannel.id, force);
	}

	avatarURL(options?: ImageOptions): string | null {
		if (!this.avatar) {
			return null;
		}

		return this.rest.cdn.avatar(this.id, this.avatar, options);
	}

	async fetch() {
		return this.client.webhooks.fetch(this.id, this.token);
	}

	async edit(body: RESTPatchAPIWebhookJSONBody | RESTPatchAPIWebhookWithTokenJSONBody, reason?: string) {
		return this.client.webhooks.edit(this.id, body, { reason, token: this.token });
	}

	delete(reason?: string) {
		return this.client.webhooks.delete(this.id, { token: this.token, reason });
	}

	static messages({ client, webhookId, webhookToken }: MethodContext<{ webhookId: string; webhookToken: string }>) {
		return {
			write: (payload: MessageWebhookMethodWriteParams) =>
				client.webhooks.writeMessage(webhookId, webhookToken, payload),
			edit: (payload: MessageWebhookMethodEditParams) => client.webhooks.editMessage(webhookId, webhookToken, payload),
			delete: (messageId: string, reason?: string) =>
				client.webhooks.deleteMessage(webhookId, webhookToken, messageId, reason),
		};
	}

	static methods({ client, webhookId, webhookToken }: MethodContext<{ webhookId: string; webhookToken?: string }>) {
		return {
			delete: (reason?: string) => client.webhooks.delete(webhookId, { reason, token: webhookToken }),
			edit: (body: RESTPatchAPIWebhookWithTokenJSONBody | RESTPatchAPIWebhookJSONBody, reason?: string) =>
				client.webhooks.edit(webhookId, body, { token: webhookToken, reason }),
			fetch: () => client.webhooks.fetch(webhookId, webhookToken),
		};
	}
}

export type MessageWebhookMethodEditParams = MessageWebhookPayload<
	MessageWebhookUpdateBodyRequest,
	{ messageId: string; query?: RESTGetAPIWebhookWithTokenMessageQuery }
>;
export type MessageWebhookMethodWriteParams = MessageWebhookPayload<
	MessageWebhookCreateBodyRequest,
	{ query?: RESTPostAPIWebhookWithTokenQuery }
>;
