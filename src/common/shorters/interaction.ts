import { BaseInteraction, type RawFile, WebhookMessage, resolveFiles } from '../..';
import type { InteractionMessageUpdateBodyRequest, MessageWebhookCreateBodyRequest } from '../types/write';
import { BaseShorter } from './base';

export class InteractionShorter extends BaseShorter {
	protected get appId() {
		return this.client.applicationId;
	}

	fetchResponse(token: string, messageId: string) {
		return this.client.webhooks.fetchMessage(this.appId, token, messageId);
	}

	fetchOriginal(token: string) {
		return this.fetchResponse(token, '@original');
	}

	async editMessage(token: string, messageId: string, body: InteractionMessageUpdateBodyRequest) {
		const { files, ...data } = body;
		const apiMessage = await this.client.proxy
			.webhooks(this.appId)(token)
			.messages(messageId)
			.patch({
				body: BaseInteraction.transformBody(data),
				files: files ? await resolveFiles(files) : undefined,
			});
		return new WebhookMessage(this.client, apiMessage, this.client.applicationId, token);
	}

	editOriginal(token: string, body: InteractionMessageUpdateBodyRequest) {
		return this.editMessage(token, '@original', body);
	}

	deleteResponse(interactionId: string, token: string, messageId: string) {
		return this.client.proxy
			.webhooks(this.appId)(token)
			.messages(messageId)
			.delete()
			.then(() => this.client.components?.onMessageDelete(messageId === '@original' ? interactionId : messageId));
	}

	deleteOriginal(interactionId: string, token: string) {
		return this.deleteResponse(interactionId, token, '@original');
	}

	async followup(token: string, { files, ...body }: MessageWebhookCreateBodyRequest) {
		files = files ? await resolveFiles(files) : undefined;
		const apiMessage = await this.client.proxy
			.webhooks(this.appId)(token)
			.post({
				body: BaseInteraction.transformBody(body),
				files: files as RawFile[] | undefined,
			});
		return new WebhookMessage(this.client, apiMessage, this.appId, token);
	}
}
