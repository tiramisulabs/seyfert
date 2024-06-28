import { type ReplyInteractionBody } from '../..';
import type { InteractionMessageUpdateBodyRequest, MessageWebhookCreateBodyRequest } from '../types/write';
import { BaseShorter } from './base';
export declare class InteractionShorter extends BaseShorter {
    reply(id: string, token: string, body: ReplyInteractionBody): Promise<never>;
    fetchResponse(token: string, messageId: string): Promise<import("../..").WebhookMessage | undefined>;
    fetchOriginal(token: string): Promise<import("../..").WebhookMessage | undefined>;
    editMessage(token: string, messageId: string, body: InteractionMessageUpdateBodyRequest): Promise<import("../..").WebhookMessage>;
    editOriginal(token: string, body: InteractionMessageUpdateBodyRequest): Promise<import("../..").WebhookMessage>;
    deleteResponse(interactionId: string, token: string, messageId: string): Promise<void | undefined>;
    deleteOriginal(interactionId: string, token: string): Promise<void | undefined>;
    followup(token: string, { files, ...body }: MessageWebhookCreateBodyRequest): Promise<import("../..").WebhookMessage>;
}
