"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMessageEmbed = exports.WebhookMessage = exports.Message = exports.BaseMessage = void 0;
const common_1 = require("../common");
const ActionRow_1 = require("../components/ActionRow");
const DiscordBase_1 = require("./extra/DiscordBase");
const functions_1 = require("./extra/functions");
const __1 = require("..");
const transformers_1 = require("../client/transformers");
class BaseMessage extends DiscordBase_1.DiscordBase {
    embeds;
    constructor(client, data) {
        super(client, data);
        this.mentions = {
            roles: data.mention_roles ?? [],
            channels: data.mention_channels ?? [],
            users: [],
        };
        this.components = data.components?.map(x => new ActionRow_1.MessageActionRowComponent(x)) ?? [];
        this.embeds = data.embeds.map(embed => new InMessageEmbed(embed));
        this.patch(data);
    }
    get user() {
        return this.author;
    }
    createComponentCollector(options) {
        return this.client.components.createComponentCollector(this.id, options);
    }
    get url() {
        return (0, functions_1.messageLink)(this.channelId, this.id, this.guildId);
    }
    guild(force = false) {
        if (!this.guildId)
            return;
        return this.client.guilds.fetch(this.guildId, force);
    }
    async channel(force = false) {
        return this.client.channels.fetch(this.channelId, force);
    }
    react(emoji) {
        return this.client.reactions.add(this.id, this.channelId, emoji);
    }
    patch(data) {
        if ('timestamp' in data && data.timestamp) {
            this.timestamp = Date.parse(data.timestamp);
        }
        if ('author' in data && data.author) {
            this.author = transformers_1.Transformers.User(this.client, data.author);
        }
        if ('member' in data && data.member) {
            this.member = transformers_1.Transformers.GuildMember(this.client, data.member, data.author, this.guildId);
        }
        if (data.mentions?.length) {
            this.mentions.users = this.guildId
                ? data.mentions.map(m => transformers_1.Transformers.GuildMember(this.client, {
                    ...m.member,
                    user: m,
                }, m, this.guildId))
                : data.mentions.map(u => transformers_1.Transformers.User(this.client, u));
        }
        if (data.poll) {
            this.poll = transformers_1.Transformers.Poll(this.client, data.poll, this.channelId, this.id);
        }
    }
}
exports.BaseMessage = BaseMessage;
class Message extends BaseMessage {
    constructor(client, data) {
        super(client, data);
    }
    fetch() {
        return this.client.messages.fetch(this.id, this.channelId);
    }
    reply(body, fail = true) {
        return this.write({
            ...body,
            message_reference: {
                message_id: this.id,
                channel_id: this.channelId,
                guild_id: this.guildId,
                fail_if_not_exists: fail,
            },
        });
    }
    edit(body) {
        return this.client.messages.edit(this.id, this.channelId, body);
    }
    write(body) {
        return this.client.messages.write(this.channelId, body);
    }
    delete(reason) {
        return this.client.messages.delete(this.id, this.channelId, reason);
    }
    crosspost(reason) {
        return this.client.messages.crosspost(this.id, this.channelId, reason);
    }
}
exports.Message = Message;
class WebhookMessage extends BaseMessage {
    webhookId;
    webhookToken;
    constructor(client, data, webhookId, webhookToken) {
        super(client, data);
        this.webhookId = webhookId;
        this.webhookToken = webhookToken;
    }
    fetch() {
        return this.api.webhooks(this.webhookId)(this.webhookToken).get({ query: this.thread?.id });
    }
    edit(body) {
        const { query, ...rest } = body;
        return this.client.webhooks.editMessage(this.webhookId, this.webhookToken, {
            body: rest,
            query,
            messageId: this.id,
        });
    }
    write(body) {
        const { query, ...rest } = body;
        return this.client.webhooks.writeMessage(this.webhookId, this.webhookToken, {
            body: rest,
            query,
        });
    }
    delete(reason) {
        return this.client.webhooks.deleteMessage(this.webhookId, this.webhookToken, this.id, reason);
    }
}
exports.WebhookMessage = WebhookMessage;
class InMessageEmbed {
    data;
    constructor(data) {
        this.data = data;
    }
    get title() {
        return this.data.title;
    }
    /**
     * @deprecated
     */
    get type() {
        return this.data.type;
    }
    get description() {
        return this.data.description;
    }
    get url() {
        return this.data.url;
    }
    get timestamp() {
        return this.data.timestamp;
    }
    get color() {
        return this.data.color;
    }
    get footer() {
        return this.data.footer ? (0, common_1.toCamelCase)(this.data.footer) : undefined;
    }
    get image() {
        return this.data.image ? (0, common_1.toCamelCase)(this.data.image) : undefined;
    }
    get thumbnail() {
        return this.data.thumbnail ? (0, common_1.toCamelCase)(this.data.thumbnail) : undefined;
    }
    get video() {
        return this.data.video ? (0, common_1.toCamelCase)(this.data.video) : undefined;
    }
    get provider() {
        return this.data.provider;
    }
    get author() {
        return this.data.author ? (0, common_1.toCamelCase)(this.data.author) : undefined;
    }
    get fields() {
        return this.data.fields;
    }
    toBuilder() {
        return new __1.Embed(this.data);
    }
    toJSON() {
        return { ...this.data };
    }
}
exports.InMessageEmbed = InMessageEmbed;
