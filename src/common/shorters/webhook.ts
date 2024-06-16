import type {
	RESTPatchAPIWebhookJSONBody,
	RESTPatchAPIWebhookWithTokenJSONBody,
	RESTPostAPIChannelWebhookJSONBody,
	RESTPostAPIWebhookWithTokenJSONBody,
} from 'discord-api-types/v10';
import { resolveFiles } from '../../builders';
import {
	MessagesMethods,
	type MessageWebhookMethodEditParams,
	type MessageWebhookMethodWriteParams,
} from '../../structures';
import { BaseShorter } from './base';
import { Transformers } from '../../client/transformers';

export class WebhookShorter extends BaseShorter {
	async create(channelId: string, body: RESTPostAPIChannelWebhookJSONBody) {
		const webhook = await this.client.proxy.channels(channelId).webhooks.post({
			body,
		});
		return Transformers.Webhook(this.client, webhook);
	}
	/**
	 * Deletes a webhook.
	 * @param webhookId The ID of the webhook.
	 * @param options The optional parameters including token and reason.
	 * @returns A Promise that resolves when the webhook is deleted.
	 */
	delete(webhookId: string, options: WebhookShorterOptionalParams) {
		if (options.token) {
			return this.client.proxy.webhooks(webhookId)(options.token).delete({ reason: options.reason, auth: false });
		}
		return this.client.proxy.webhooks(webhookId).delete({ reason: options.reason });
	}

	/**
	 * Edits a webhook.
	 * @param webhookId The ID of the webhook.
	 * @param body The data to update the webhook with.
	 * @param options The optional parameters including token and reason.
	 * @returns A Promise that resolves when the webhook is edited.
	 */
	edit(
		webhookId: string,
		body: RESTPatchAPIWebhookWithTokenJSONBody | RESTPatchAPIWebhookJSONBody,
		options: WebhookShorterOptionalParams,
	) {
		if (options.token) {
			return this.client.proxy
				.webhooks(webhookId)(options.token)
				.patch({ body, reason: options.reason, auth: false })
				.then(webhook => Transformers.Webhook(this.client, webhook));
		}
		return this.client.proxy
			.webhooks(webhookId)
			.patch({ body, reason: options.reason })
			.then(webhook => Transformers.Webhook(this.client, webhook));
	}

	/**
	 * Fetches a webhook.
	 * @param webhookId The ID of the webhook.
	 * @param token The token of the webhook (optional).
	 * @returns A Promise that resolves to the fetched webhook.
	 */
	async fetch(webhookId: string, token?: string) {
		let webhook;
		if (token) {
			webhook = await this.client.proxy.webhooks(webhookId)(token).get({ auth: false });
		} else {
			webhook = await this.client.proxy.webhooks(webhookId).get();
		}
		return Transformers.Webhook(this.client, webhook);
	}

	/**
	 * Writes a message using the webhook.
	 * @param webhookId The ID of the webhook.
	 * @param token The token of the webhook.
	 * @param data The data for writing the message.
	 * @returns A Promise that resolves to the written message.
	 */
	async writeMessage(webhookId: string, token: string, { body: data, ...payload }: MessageWebhookMethodWriteParams) {
		const { files, ...body } = data;
		const parsedFiles = files ? await resolveFiles(files) : [];
		const transformedBody = MessagesMethods.transformMessageBody<RESTPostAPIWebhookWithTokenJSONBody>(
			body,
			parsedFiles,
			this.client,
		);
		return this.client.proxy
			.webhooks(webhookId)(token)
			.post({ ...payload, files: parsedFiles, body: transformedBody })
			.then(m => (m?.id ? Transformers.WebhookMessage(this.client, m, webhookId, token) : null));
	}

	/**
	 * Edits a message sent by the webhook.
	 * @param webhookId The ID of the webhook.
	 * @param token The token of the webhook.
	 * @param messageId The ID of the message to edit.
	 * @param data The data for editing the message.
	 * @returns A Promise that resolves to the edited message.
	 */
	async editMessage(
		webhookId: string,
		token: string,
		{ messageId, body: data, ...json }: MessageWebhookMethodEditParams,
	) {
		const { files, ...body } = data;
		const parsedFiles = files ? await resolveFiles(files) : [];
		const transformedBody = MessagesMethods.transformMessageBody<RESTPostAPIWebhookWithTokenJSONBody>(
			body,
			parsedFiles,
			this.client,
		);
		return this.client.proxy
			.webhooks(webhookId)(token)
			.messages(messageId)
			.patch({ ...json, auth: false, files: parsedFiles, body: transformedBody })
			.then(m => Transformers.WebhookMessage(this.client, m, webhookId, token));
	}

	/**
	 * Deletes a message sent by the webhook.
	 * @param webhookId The ID of the webhook.
	 * @param token The token of the webhook.
	 * @param messageId The ID of the message to delete.
	 * @param reason The reason for deleting the message.
	 * @returns A Promise that resolves when the message is deleted.
	 */
	deleteMessage(webhookId: string, token: string, messageId: string, reason?: string) {
		return this.client.proxy.webhooks(webhookId)(token).messages(messageId).delete({ reason });
	}

	/**
	 * Fetches a message sent by the webhook.
	 * @param webhookId The ID of the webhook.
	 * @param token The token of the webhook.
	 * @param messageId The ID of the message to fetch.
	 * @param threadId The ID of the thread the message belongs to.
	 * @returns A Promise that resolves to the fetched message, or undefined if not found.
	 */
	async fetchMessage(webhookId: string, token: string, messageId: string, threadId?: string) {
		const message = await this.client.proxy
			.webhooks(webhookId)(token)
			.messages(messageId)
			.get({ auth: false, query: { threadId } });
		return message ? Transformers.WebhookMessage(this.client, message, webhookId, token) : undefined;
	}

	async listFromGuild(guildId: string) {
		const webhooks = await this.client.proxy.guilds(guildId).webhooks.get();
		return webhooks.map(webhook => Transformers.Webhook(this.client, webhook));
	}

	async listFromChannel(channelId: string) {
		const webhooks = await this.client.proxy.channels(channelId).webhooks.get();
		return webhooks.map(webhook => Transformers.Webhook(this.client, webhook));
	}
}

export type WebhookShorterOptionalParams = Partial<{ token: string; reason: string }>;
