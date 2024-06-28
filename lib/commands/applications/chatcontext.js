"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandContext = void 0;
const v10_1 = require("discord-api-types/v10");
const structures_1 = require("../../structures");
const basecontext_1 = require("../basecontext");
class CommandContext extends basecontext_1.BaseContext {
    client;
    resolver;
    shardId;
    command;
    message;
    interaction;
    messageResponse;
    constructor(client, data, resolver, shardId, command) {
        super(client);
        this.client = client;
        this.resolver = resolver;
        this.shardId = shardId;
        this.command = command;
        if (data instanceof structures_1.ChatInputCommandInteraction) {
            this.interaction = data;
        }
        else {
            this.message = data;
        }
    }
    options = {};
    metadata = {};
    globalMetadata = {};
    get proxy() {
        return this.client.proxy;
    }
    get t() {
        return this.client.t(this.interaction?.locale ?? this.client.langs?.defaultLang ?? 'en-US');
    }
    get fullCommandName() {
        return this.resolver.fullCommandName;
    }
    async write(body, fetchReply) {
        if (this.interaction)
            return this.interaction.write(body, fetchReply);
        const options = this.client.options?.commands;
        return (this.messageResponse = await this.message[!this.messageResponse && options?.reply?.(this) ? 'reply' : 'write'](body));
    }
    async deferReply(ephemeral = false) {
        if (this.interaction)
            return this.interaction.deferReply(ephemeral ? v10_1.MessageFlags.Ephemeral : undefined);
        const options = this.client.options?.commands;
        return (this.messageResponse = await this.message[options?.reply?.(this) ? 'reply' : 'write'](options?.deferReplyResponse?.(this) ?? { content: 'Thinking...' }));
    }
    async editResponse(body) {
        if (this.interaction)
            return this.interaction.editResponse(body);
        return (this.messageResponse = await this.messageResponse.edit(body));
    }
    deleteResponse() {
        if (this.interaction)
            return this.interaction.deleteResponse();
        return this.messageResponse.delete();
    }
    editOrReply(body, fetchReply) {
        if (this.interaction)
            return this.interaction.editOrReply(body, fetchReply);
        if (this.messageResponse) {
            return this.editResponse(body);
        }
        return this.write(body, fetchReply);
    }
    async fetchResponse() {
        if (this.interaction)
            return this.interaction.fetchResponse();
        this.messageResponse = await this.messageResponse?.fetch();
        return this.messageResponse;
    }
    channel(mode = 'cache') {
        if (this.interaction?.channel && mode === 'cache')
            return this.client.cache.adapter.isAsync ? Promise.resolve(this.interaction.channel) : this.interaction.channel;
        switch (mode) {
            case 'cache':
                return (this.client.cache.channels?.get(this.channelId) ||
                    (this.client.cache.adapter.isAsync ? Promise.resolve() : undefined));
            default:
                return this.client.channels.fetch(this.channelId, mode === 'rest');
        }
    }
    me(mode = 'cache') {
        if (!this.guildId)
            return mode === 'cache' ? (this.client.cache.adapter.isAsync ? Promise.resolve() : undefined) : Promise.resolve();
        switch (mode) {
            case 'cache':
                return (this.client.cache.members?.get(this.client.botId, this.guildId) ||
                    (this.client.cache.adapter.isAsync ? Promise.resolve() : undefined));
            default:
                return this.client.members.fetch(this.guildId, this.client.botId, mode === 'rest');
        }
    }
    guild(mode = 'cache') {
        if (!this.guildId)
            return (mode === 'cache'
                ? this.client.cache.adapter.isAsync
                    ? Promise.resolve()
                    : undefined
                : Promise.resolve());
        switch (mode) {
            case 'cache':
                return (this.client.cache.guilds?.get(this.guildId) ||
                    (this.client.cache.adapter.isAsync ? Promise.resolve() : undefined));
            default:
                return this.client.guilds.fetch(this.guildId, mode === 'rest');
        }
    }
    get guildId() {
        return this.interaction?.guildId || this.message?.guildId;
    }
    get channelId() {
        return this.interaction?.channelId || this.message.channelId;
    }
    get author() {
        return this.interaction?.user || this.message.author;
    }
    get member() {
        return this.interaction?.member || this.message?.member;
    }
    isChat() {
        return true;
    }
}
exports.CommandContext = CommandContext;
