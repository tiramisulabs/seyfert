/**
 * Represents a Discord webhook.
 */
import type { APIWebhook, RESTGetAPIWebhookWithTokenMessageQuery, RESTPatchAPIWebhookJSONBody, RESTPatchAPIWebhookWithTokenJSONBody, RESTPostAPIWebhookWithTokenQuery } from 'discord-api-types/v10';
import type { UsingClient } from '../commands';
import type { ImageOptions, MessageWebhookCreateBodyRequest, MessageWebhookPayload, MessageWebhookUpdateBodyRequest, MethodContext, ObjectToLower } from '../common';
import { DiscordBase } from './extra/DiscordBase';
import { type AnonymousGuildStructure, type UserStructure } from '../client/transformers';
export interface Webhook extends DiscordBase, ObjectToLower<Omit<APIWebhook, 'user' | 'source_guild'>> {
}
/**
 * Represents a Discord webhook.
 */
export declare class Webhook extends DiscordBase {
    /** The user associated with the webhook, if applicable. */
    user?: UserStructure;
    /** The source guild of the webhook, if applicable. */
    sourceGuild?: Partial<AnonymousGuildStructure>;
    /** Methods related to interacting with messages through the webhook. */
    messages: ReturnType<typeof Webhook.messages>;
    /**
     * Constructs a new Webhook instance.
     * @param client The Discord client instance.
     * @param data The data representing the webhook.
     */
    constructor(client: UsingClient, data: APIWebhook);
    /**
     * Fetches the guild associated with the webhook.
     * @param force Whether to force fetching the guild even if it's already cached.
     * @returns A promise that resolves to the guild associated with the webhook, or undefined if not applicable.
     */
    guild(force?: boolean): Promise<import("./Guild").Guild<"api">> | undefined;
    /**
     * Fetches the channel associated with the webhook.
     * @param force Whether to force fetching the channel even if it's already cached.
     * @returns A promise that resolves to the channel associated with the webhook, or undefined if not applicable.
     */
    channel(force?: boolean): Promise<import("./channels").BaseChannel<import("discord-api-types/v10").ChannelType> | import("./channels").DMChannel | import("./channels").CategoryChannel | undefined>;
    /**
     * Retrieves the avatar URL of the webhook.
     * @param options The image options for the avatar.
     * @returns The avatar URL of the webhook, or null if no avatar is set.
     */
    avatarURL(options?: ImageOptions): string | null;
    /**
     * Fetches the webhook data from the Discord API.
     * @returns A promise that resolves to the fetched webhook data.
     */
    fetch(): Promise<Webhook>;
    /**
     * Edits the webhook.
     * @param body The new webhook data.
     * @param reason The reason for editing the webhook.
     * @returns A promise that resolves when the webhook is successfully edited.
     */
    edit(body: RESTPatchAPIWebhookJSONBody | RESTPatchAPIWebhookWithTokenJSONBody, reason?: string): Promise<Webhook>;
    /**
     * Deletes the webhook.
     * @param reason The reason for deleting the webhook.
     * @returns A promise that resolves when the webhook is successfully deleted.
     */
    delete(reason?: string): Promise<never>;
    /**
     * Static methods related to interacting with messages through webhooks.
     */
    static messages({ client, webhookId, webhookToken }: MethodContext<{
        webhookId: string;
        webhookToken: string;
    }>): {
        /** Writes a message through the webhook. */
        write: (payload: MessageWebhookMethodWriteParams) => Promise<import("./Message").WebhookMessage | null>;
        /** Edits a message sent through the webhook. */
        edit: (payload: MessageWebhookMethodEditParams) => Promise<import("./Message").WebhookMessage>;
        /** Deletes a message sent through the webhook. */
        delete: (messageId: string, reason?: string) => Promise<never>;
    };
    /**
     * Static methods related to managing webhooks.
     */
    static methods({ client, webhookId, webhookToken }: MethodContext<{
        webhookId: string;
        webhookToken?: string;
    }>): {
        /** Deletes the webhook. */
        delete: (reason?: string) => Promise<never>;
        /** Edits the webhook. */
        edit: (body: RESTPatchAPIWebhookWithTokenJSONBody | RESTPatchAPIWebhookJSONBody, reason?: string) => Promise<Webhook>;
        /** Fetches the webhook data from the Discord API. */
        fetch: () => Promise<Webhook>;
    };
}
/** Type definition for parameters of editing a message through a webhook. */
export type MessageWebhookMethodEditParams = MessageWebhookPayload<MessageWebhookUpdateBodyRequest, {
    messageId: string;
    query?: RESTGetAPIWebhookWithTokenMessageQuery;
}>;
/** Type definition for parameters of writing a message through a webhook. */
export type MessageWebhookMethodWriteParams = MessageWebhookPayload<MessageWebhookCreateBodyRequest, {
    query?: RESTPostAPIWebhookWithTokenQuery;
}>;
