"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MenuCommandContext = void 0;
const v10_1 = require("discord-api-types/v10");
const common_1 = require("../../common");
const basecontext_1 = require("../basecontext");
const transformers_1 = require("../../client/transformers");
class MenuCommandContext extends basecontext_1.BaseContext {
    client;
    interaction;
    shardId;
    command;
    constructor(client, interaction, shardId, command) {
        super(client);
        this.client = client;
        this.interaction = interaction;
        this.shardId = shardId;
        this.command = command;
    }
    metadata = {};
    globalMetadata = {};
    // biome-ignore lint/suspicious/useGetterReturn: default don't exist.
    get target() {
        switch (this.interaction.data.type) {
            case v10_1.ApplicationCommandType.Message: {
                const data = this.interaction.data.resolved.messages[this.interaction.data.targetId];
                return transformers_1.Transformers.Message(this.client, (0, common_1.toSnakeCase)(data));
            }
            case v10_1.ApplicationCommandType.User: {
                const data = this.interaction.data.resolved.users[this.interaction.data.targetId];
                return transformers_1.Transformers.User(this.client, (0, common_1.toSnakeCase)(data));
            }
        }
    }
    get t() {
        return this.client.t(this.interaction.locale ?? this.client.langs.defaultLang ?? 'en-US');
    }
    get fullCommandName() {
        return this.command.name;
    }
    write(body, fetchReply) {
        return this.interaction.write(body, fetchReply);
    }
    modal(body) {
        return this.interaction.modal(body);
    }
    deferReply(ephemeral = false) {
        return this.interaction.deferReply(ephemeral ? v10_1.MessageFlags.Ephemeral : undefined);
    }
    editResponse(body) {
        return this.interaction.editResponse(body);
    }
    deleteResponse() {
        return this.interaction.deleteResponse();
    }
    editOrReply(body, fetchReply) {
        return this.interaction.editOrReply(body, fetchReply);
    }
    fetchResponse() {
        return this.interaction.fetchResponse();
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
    get guildId() {
        return this.interaction.guildId;
    }
    get channelId() {
        return this.interaction.channelId;
    }
    get author() {
        return this.interaction.user;
    }
    get member() {
        return this.interaction.member;
    }
    isMenu() {
        return true;
    }
    isMenuUser() {
        return this.interaction.data.type === v10_1.ApplicationCommandType.User;
    }
    isMenuMessage() {
        return this.interaction.data.type === v10_1.ApplicationCommandType.Message;
    }
}
exports.MenuCommandContext = MenuCommandContext;
