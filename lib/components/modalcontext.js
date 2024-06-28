"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModalContext = void 0;
const v10_1 = require("discord-api-types/v10");
const basecontext_1 = require("../commands/basecontext");
/**
 * Represents a context for interacting with components in a Discord bot.
 * @template Type - The type of component interaction.
 */
class ModalContext extends basecontext_1.BaseContext {
    client;
    interaction;
    /**
     * Creates a new instance of the ComponentContext class.
     * @param client - The UsingClient instance.
     * @param interaction - The component interaction object.
     */
    constructor(client, interaction) {
        super(client);
        this.client = client;
        this.interaction = interaction;
    }
    command;
    metadata = {};
    globalMetadata = {};
    get customId() {
        return this.interaction.customId;
    }
    get components() {
        return this.interaction.components;
    }
    /**
     * Gets the language object for the interaction's locale.
     */
    get t() {
        return this.client.t(this.interaction?.locale ?? this.client.langs?.defaultLang ?? 'en-US');
    }
    /**
     * Writes a response to the interaction.
     * @param body - The body of the response.
     * @param fetchReply - Whether to fetch the reply or not.
     */
    write(body, fetchReply) {
        return this.interaction.write(body, fetchReply);
    }
    /**
     * Defers the reply to the interaction.
     * @param ephemeral - Whether the reply should be ephemeral or not.
     */
    deferReply(ephemeral = false) {
        return this.interaction.deferReply(ephemeral ? v10_1.MessageFlags.Ephemeral : undefined);
    }
    /**
     * Edits the response of the interaction.
     * @param body - The updated body of the response.
     */
    editResponse(body) {
        return this.interaction.editResponse(body);
    }
    /**
     * Edits the response or replies to the interaction.
     * @param body - The body of the response or updated body of the interaction.
     * @param fetchReply - Whether to fetch the reply or not.
     */
    editOrReply(body, fetchReply) {
        return this.interaction.editOrReply(body, fetchReply);
    }
    /**
     * Deletes the response of the interaction.
     * @returns A promise that resolves when the response is deleted.
     */
    deleteResponse() {
        return this.interaction.deleteResponse();
    }
    modal(body) {
        //@ts-expect-error
        return this.interaction.modal(body);
    }
    channel(mode = 'cache') {
        if (this.interaction?.channel && mode === 'cache')
            return this.client.cache.adapter.isAsync ? Promise.resolve(this.interaction.channel) : this.interaction.channel;
        return this.client.channels.fetch(this.channelId, mode === 'rest');
    }
    me(mode = 'cache') {
        if (!this.guildId)
            return mode === 'cache' ? (this.client.cache.adapter.isAsync ? Promise.resolve() : undefined) : Promise.resolve();
        switch (mode) {
            case 'cache':
                return this.client.cache.members?.get(this.client.botId, this.guildId);
            default:
                return this.client.members.fetch(this.guildId, this.client.botId, mode === 'rest');
        }
    }
    guild(mode = 'cache') {
        if (!this.guildId)
            return (mode === 'cache' ? (this.client.cache.adapter.isAsync ? Promise.resolve() : undefined) : Promise.resolve());
        switch (mode) {
            case 'cache':
                return this.client.cache.guilds?.get(this.guildId);
            default:
                return this.client.guilds.fetch(this.guildId, mode === 'rest');
        }
    }
    /**
     * Gets the ID of the guild of the interaction.
     */
    get guildId() {
        return this.interaction.guildId;
    }
    /**
     * Gets the ID of the channel of the interaction.
     */
    get channelId() {
        return this.interaction.channelId;
    }
    /**
     * Gets the author of the interaction.
     */
    get author() {
        return this.interaction.user;
    }
    /**
     * Gets the member of the interaction.
     */
    get member() {
        return this.interaction.member;
    }
    isModal() {
        return true;
    }
}
exports.ModalContext = ModalContext;
