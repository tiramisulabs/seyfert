"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookShorter = void 0;
const builders_1 = require("../../builders");
const structures_1 = require("../../structures");
const base_1 = require("./base");
const transformers_1 = require("../../client/transformers");
class WebhookShorter extends base_1.BaseShorter {
    async create(channelId, body) {
        const webhook = await this.client.proxy.channels(channelId).webhooks.post({
            body,
        });
        return transformers_1.Transformers.Webhook(this.client, webhook);
    }
    /**
     * Deletes a webhook.
     * @param webhookId The ID of the webhook.
     * @param options The optional parameters including token and reason.
     * @returns A Promise that resolves when the webhook is deleted.
     */
    delete(webhookId, options) {
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
    edit(webhookId, body, options) {
        if (options.token) {
            return this.client.proxy
                .webhooks(webhookId)(options.token)
                .patch({ body, reason: options.reason, auth: false })
                .then(webhook => transformers_1.Transformers.Webhook(this.client, webhook));
        }
        return this.client.proxy
            .webhooks(webhookId)
            .patch({ body, reason: options.reason })
            .then(webhook => transformers_1.Transformers.Webhook(this.client, webhook));
    }
    /**
     * Fetches a webhook.
     * @param webhookId The ID of the webhook.
     * @param token The token of the webhook (optional).
     * @returns A Promise that resolves to the fetched webhook.
     */
    async fetch(webhookId, token) {
        let webhook;
        if (token) {
            webhook = await this.client.proxy.webhooks(webhookId)(token).get({ auth: false });
        }
        else {
            webhook = await this.client.proxy.webhooks(webhookId).get();
        }
        return transformers_1.Transformers.Webhook(this.client, webhook);
    }
    /**
     * Writes a message using the webhook.
     * @param webhookId The ID of the webhook.
     * @param token The token of the webhook.
     * @param data The data for writing the message.
     * @returns A Promise that resolves to the written message.
     */
    async writeMessage(webhookId, token, { body: data, ...payload }) {
        const { files, ...body } = data;
        const parsedFiles = files ? await (0, builders_1.resolveFiles)(files) : [];
        const transformedBody = structures_1.MessagesMethods.transformMessageBody(body, parsedFiles, this.client);
        return this.client.proxy
            .webhooks(webhookId)(token)
            .post({ ...payload, files: parsedFiles, body: transformedBody })
            .then(m => (m?.id ? transformers_1.Transformers.WebhookMessage(this.client, m, webhookId, token) : null));
    }
    /**
     * Edits a message sent by the webhook.
     * @param webhookId The ID of the webhook.
     * @param token The token of the webhook.
     * @param messageId The ID of the message to edit.
     * @param data The data for editing the message.
     * @returns A Promise that resolves to the edited message.
     */
    async editMessage(webhookId, token, { messageId, body: data, ...json }) {
        const { files, ...body } = data;
        const parsedFiles = files ? await (0, builders_1.resolveFiles)(files) : [];
        const transformedBody = structures_1.MessagesMethods.transformMessageBody(body, parsedFiles, this.client);
        return this.client.proxy
            .webhooks(webhookId)(token)
            .messages(messageId)
            .patch({ ...json, auth: false, files: parsedFiles, body: transformedBody })
            .then(m => transformers_1.Transformers.WebhookMessage(this.client, m, webhookId, token));
    }
    /**
     * Deletes a message sent by the webhook.
     * @param webhookId The ID of the webhook.
     * @param token The token of the webhook.
     * @param messageId The ID of the message to delete.
     * @param reason The reason for deleting the message.
     * @returns A Promise that resolves when the message is deleted.
     */
    deleteMessage(webhookId, token, messageId, reason) {
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
    async fetchMessage(webhookId, token, messageId, threadId) {
        const message = await this.client.proxy
            .webhooks(webhookId)(token)
            .messages(messageId)
            .get({ auth: false, query: { threadId } });
        return message ? transformers_1.Transformers.WebhookMessage(this.client, message, webhookId, token) : undefined;
    }
    async listFromGuild(guildId) {
        const webhooks = await this.client.proxy.guilds(guildId).webhooks.get();
        return webhooks.map(webhook => transformers_1.Transformers.Webhook(this.client, webhook));
    }
    async listFromChannel(channelId) {
        const webhooks = await this.client.proxy.channels(channelId).webhooks.get();
        return webhooks.map(webhook => transformers_1.Transformers.Webhook(this.client, webhook));
    }
}
exports.WebhookShorter = WebhookShorter;
