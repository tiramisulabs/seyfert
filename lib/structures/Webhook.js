"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Webhook = void 0;
const DiscordBase_1 = require("./extra/DiscordBase");
const transformers_1 = require("../client/transformers");
/**
 * Represents a Discord webhook.
 */
class Webhook extends DiscordBase_1.DiscordBase {
    /** The user associated with the webhook, if applicable. */
    user;
    /** The source guild of the webhook, if applicable. */
    sourceGuild;
    /** Methods related to interacting with messages through the webhook. */
    messages;
    /**
     * Constructs a new Webhook instance.
     * @param client The Discord client instance.
     * @param data The data representing the webhook.
     */
    constructor(client, data) {
        super(client, data);
        if (data.user) {
            this.user = transformers_1.Transformers.User(this.client, data.user);
        }
        if (data.source_guild) {
            this.sourceGuild = transformers_1.Transformers.AnonymousGuild(this.client, data.source_guild);
        }
        Object.assign(this, {
            messages: Webhook.messages({ client, webhookId: this.id, webhookToken: this.token }),
        });
    }
    /**
     * Fetches the guild associated with the webhook.
     * @param force Whether to force fetching the guild even if it's already cached.
     * @returns A promise that resolves to the guild associated with the webhook, or undefined if not applicable.
     */
    guild(force = false) {
        if (!this.sourceGuild?.id)
            return;
        return this.client.guilds.fetch(this.sourceGuild.id, force);
    }
    /**
     * Fetches the channel associated with the webhook.
     * @param force Whether to force fetching the channel even if it's already cached.
     * @returns A promise that resolves to the channel associated with the webhook, or undefined if not applicable.
     */
    async channel(force = false) {
        if (!this.sourceChannel?.id)
            return;
        return this.client.channels.fetch(this.sourceChannel.id, force);
    }
    /**
     * Retrieves the avatar URL of the webhook.
     * @param options The image options for the avatar.
     * @returns The avatar URL of the webhook, or null if no avatar is set.
     */
    avatarURL(options) {
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
    async edit(body, reason) {
        return this.client.webhooks.edit(this.id, body, { reason, token: this.token });
    }
    /**
     * Deletes the webhook.
     * @param reason The reason for deleting the webhook.
     * @returns A promise that resolves when the webhook is successfully deleted.
     */
    delete(reason) {
        return this.client.webhooks.delete(this.id, { token: this.token, reason });
    }
    /**
     * Static methods related to interacting with messages through webhooks.
     */
    static messages({ client, webhookId, webhookToken }) {
        return {
            /** Writes a message through the webhook. */
            write: (payload) => client.webhooks.writeMessage(webhookId, webhookToken, payload),
            /** Edits a message sent through the webhook. */
            edit: (payload) => client.webhooks.editMessage(webhookId, webhookToken, payload),
            /** Deletes a message sent through the webhook. */
            delete: (messageId, reason) => client.webhooks.deleteMessage(webhookId, webhookToken, messageId, reason),
        };
    }
    /**
     * Static methods related to managing webhooks.
     */
    static methods({ client, webhookId, webhookToken }) {
        return {
            /** Deletes the webhook. */
            delete: (reason) => client.webhooks.delete(webhookId, { reason, token: webhookToken }),
            /** Edits the webhook. */
            edit: (body, reason) => client.webhooks.edit(webhookId, body, { token: webhookToken, reason }),
            /** Fetches the webhook data from the Discord API. */
            fetch: () => client.webhooks.fetch(webhookId, webhookToken),
        };
    }
}
exports.Webhook = Webhook;
