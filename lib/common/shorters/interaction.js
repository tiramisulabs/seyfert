"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InteractionShorter = void 0;
const __1 = require("../..");
const transformers_1 = require("../../client/transformers");
const base_1 = require("./base");
class InteractionShorter extends base_1.BaseShorter {
    async reply(id, token, body) {
        //@ts-expect-error
        const { files, ...rest } = body.data ?? {};
        //@ts-expect-error
        const data = body.data instanceof __1.Modal ? body.data : rest;
        const parsedFiles = files ? await (0, __1.resolveFiles)(files) : undefined;
        return this.client.proxy
            .interactions(id)(token)
            .callback.post({
            body: __1.BaseInteraction.transformBodyRequest({
                type: body.type,
                data,
            }, parsedFiles, this.client),
            files: parsedFiles,
        });
    }
    fetchResponse(token, messageId) {
        return this.client.webhooks.fetchMessage(this.client.applicationId, token, messageId);
    }
    fetchOriginal(token) {
        return this.fetchResponse(token, '@original');
    }
    async editMessage(token, messageId, body) {
        const { files, ...data } = body;
        const parsedFiles = files ? await (0, __1.resolveFiles)(files) : undefined;
        const apiMessage = await this.client.proxy
            .webhooks(this.client.applicationId)(token)
            .messages(messageId)
            .patch({
            body: __1.BaseInteraction.transformBody(data, parsedFiles, this.client),
            files: parsedFiles,
        });
        return transformers_1.Transformers.WebhookMessage(this.client, apiMessage, this.client.applicationId, token);
    }
    editOriginal(token, body) {
        return this.editMessage(token, '@original', body);
    }
    deleteResponse(interactionId, token, messageId) {
        return this.client.proxy
            .webhooks(this.client.applicationId)(token)
            .messages(messageId)
            .delete()
            .then(() => this.client.components?.onMessageDelete(messageId === '@original' ? interactionId : messageId));
    }
    deleteOriginal(interactionId, token) {
        return this.deleteResponse(interactionId, token, '@original');
    }
    async followup(token, { files, ...body }) {
        const parsedFiles = files ? await (0, __1.resolveFiles)(files) : undefined;
        const apiMessage = await this.client.proxy
            .webhooks(this.client.applicationId)(token)
            .post({
            body: __1.BaseInteraction.transformBody(body, parsedFiles, this.client),
            files: parsedFiles,
        });
        return transformers_1.Transformers.WebhookMessage(this.client, apiMessage, this.client.applicationId, token);
    }
}
exports.InteractionShorter = InteractionShorter;
