import type { RESTPatchAPIWebhookJSONBody, RESTPatchAPIWebhookWithTokenJSONBody, RESTPostAPIChannelWebhookJSONBody } from 'discord-api-types/v10';
import { type MessageWebhookMethodEditParams, type MessageWebhookMethodWriteParams } from '../../structures';
import { BaseShorter } from './base';
export declare class WebhookShorter extends BaseShorter {
    create(channelId: string, body: RESTPostAPIChannelWebhookJSONBody): Promise<import("../../structures").Webhook>;
    /**
     * Deletes a webhook.
     * @param webhookId The ID of the webhook.
     * @param options The optional parameters including token and reason.
     * @returns A Promise that resolves when the webhook is deleted.
     */
    delete(webhookId: string, options: WebhookShorterOptionalParams): Promise<never>;
    /**
     * Edits a webhook.
     * @param webhookId The ID of the webhook.
     * @param body The data to update the webhook with.
     * @param options The optional parameters including token and reason.
     * @returns A Promise that resolves when the webhook is edited.
     */
    edit(webhookId: string, body: RESTPatchAPIWebhookWithTokenJSONBody | RESTPatchAPIWebhookJSONBody, options: WebhookShorterOptionalParams): Promise<import("../../structures").Webhook>;
    /**
     * Fetches a webhook.
     * @param webhookId The ID of the webhook.
     * @param token The token of the webhook (optional).
     * @returns A Promise that resolves to the fetched webhook.
     */
    fetch(webhookId: string, token?: string): Promise<import("../../structures").Webhook>;
    /**
     * Writes a message using the webhook.
     * @param webhookId The ID of the webhook.
     * @param token The token of the webhook.
     * @param data The data for writing the message.
     * @returns A Promise that resolves to the written message.
     */
    writeMessage(webhookId: string, token: string, { body: data, ...payload }: MessageWebhookMethodWriteParams): Promise<import("../../structures").WebhookMessage | null>;
    /**
     * Edits a message sent by the webhook.
     * @param webhookId The ID of the webhook.
     * @param token The token of the webhook.
     * @param messageId The ID of the message to edit.
     * @param data The data for editing the message.
     * @returns A Promise that resolves to the edited message.
     */
    editMessage(webhookId: string, token: string, { messageId, body: data, ...json }: MessageWebhookMethodEditParams): Promise<import("../../structures").WebhookMessage>;
    /**
     * Deletes a message sent by the webhook.
     * @param webhookId The ID of the webhook.
     * @param token The token of the webhook.
     * @param messageId The ID of the message to delete.
     * @param reason The reason for deleting the message.
     * @returns A Promise that resolves when the message is deleted.
     */
    deleteMessage(webhookId: string, token: string, messageId: string, reason?: string): Promise<never>;
    /**
     * Fetches a message sent by the webhook.
     * @param webhookId The ID of the webhook.
     * @param token The token of the webhook.
     * @param messageId The ID of the message to fetch.
     * @param threadId The ID of the thread the message belongs to.
     * @returns A Promise that resolves to the fetched message, or undefined if not found.
     */
    fetchMessage(webhookId: string, token: string, messageId: string, threadId?: string): Promise<import("../../structures").WebhookMessage | undefined>;
    listFromGuild(guildId: string): Promise<import("../../structures").Webhook[]>;
    listFromChannel(channelId: string): Promise<import("../../structures").Webhook[]>;
}
export type WebhookShorterOptionalParams = Partial<{
    token: string;
    reason: string;
}>;
