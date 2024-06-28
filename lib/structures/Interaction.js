"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModalSubmitInteraction = exports.MessageCommandInteraction = exports.UserCommandInteraction = exports.ChatInputCommandInteraction = exports.UserSelectMenuInteraction = exports.RoleSelectMenuInteraction = exports.MentionableSelectMenuInteraction = exports.ChannelSelectMenuInteraction = exports.StringSelectMenuInteraction = exports.SelectMenuInteraction = exports.ButtonInteraction = exports.ComponentInteraction = exports.ApplicationCommandInteraction = exports.Interaction = exports.AutocompleteInteraction = exports.BaseInteraction = void 0;
const v10_1 = require("discord-api-types/v10");
const ts_mixer_1 = require("ts-mixer");
const builders_1 = require("../builders");
const channels_1 = __importDefault(require("./channels"));
const DiscordBase_1 = require("./extra/DiscordBase");
const Permissions_1 = require("./extra/Permissions");
const transformers_1 = require("../client/transformers");
class BaseInteraction extends DiscordBase_1.DiscordBase {
    client;
    __reply;
    user;
    member;
    channel;
    message;
    replied;
    appPermissions;
    constructor(client, interaction, __reply) {
        super(client, interaction);
        this.client = client;
        this.__reply = __reply;
        if (interaction.member) {
            this.member = transformers_1.Transformers.InteractionGuildMember(client, interaction.member, interaction.member.user, interaction.guild_id);
        }
        if (interaction.message) {
            this.message = transformers_1.Transformers.Message(client, interaction.message);
        }
        if (interaction.app_permissions) {
            this.appPermissions = new Permissions_1.PermissionsBitField(Number(interaction.app_permissions));
        }
        if (interaction.channel) {
            this.channel = (0, channels_1.default)(interaction.channel, client);
        }
        this.user = this.member?.user ?? transformers_1.Transformers.User(client, interaction.user);
    }
    static transformBodyRequest(body, files, self) {
        switch (body.type) {
            case v10_1.InteractionResponseType.ApplicationCommandAutocompleteResult:
            case v10_1.InteractionResponseType.DeferredMessageUpdate:
            case v10_1.InteractionResponseType.DeferredChannelMessageWithSource:
                return body;
            case v10_1.InteractionResponseType.ChannelMessageWithSource:
            case v10_1.InteractionResponseType.UpdateMessage: {
                return {
                    type: body.type,
                    //@ts-ignore
                    data: BaseInteraction.transformBodyRequest(body.data ?? {}, files, self),
                };
            }
            case v10_1.InteractionResponseType.Modal:
                return {
                    type: body.type,
                    data: body.data instanceof builders_1.Modal
                        ? body.data.toJSON()
                        : {
                            ...body.data,
                            components: body.data?.components
                                ? body.data.components.map(x => x instanceof builders_1.ActionRow
                                    ? x.toJSON()
                                    : x)
                                : [],
                        },
                };
            default:
                return body;
        }
    }
    static transformBody(body, files, self) {
        const poll = body.poll;
        const allow = {
            allowed_mentions: self.options?.allowedMentions,
            ...body,
            components: body.components?.map(x => (x instanceof builders_1.ActionRow ? x.toJSON() : x)),
            embeds: body?.embeds?.map(x => (x instanceof builders_1.Embed ? x.toJSON() : x)),
            poll: poll ? (poll instanceof builders_1.PollBuilder ? poll.toJSON() : poll) : undefined,
        };
        if ('attachment' in body) {
            allow.attachments =
                body.attachments?.map((x, i) => ({
                    id: i,
                    ...(0, builders_1.resolveAttachment)(x),
                })) ?? undefined;
        }
        else if (files?.length) {
            allow.attachments = files?.map((x, id) => ({
                id,
                filename: x.name,
            }));
        }
        return allow;
    }
    async matchReplied(body) {
        if (this.__reply) {
            //@ts-expect-error
            const { files, ...rest } = body.data ?? {};
            //@ts-expect-error
            const data = body.data instanceof builders_1.Modal ? body.data : rest;
            const parsedFiles = files ? await (0, builders_1.resolveFiles)(files) : undefined;
            return (this.replied = this.__reply({
                body: BaseInteraction.transformBodyRequest({ data, type: body.type }, parsedFiles, this.client),
                files: parsedFiles,
            }).then(() => (this.replied = true)));
        }
        return (this.replied = this.client.interactions.reply(this.id, this.token, body).then(() => (this.replied = true)));
    }
    async reply(body) {
        if (this.replied) {
            throw new Error('Interaction already replied');
        }
        await this.matchReplied(body);
        // @ts-expect-error
        if (body.data instanceof builders_1.Modal && body.data.__exec)
            // @ts-expect-error
            this.client.components.modals.set(this.user.id, body.data.__exec);
    }
    deferReply(flags) {
        return this.reply({
            type: v10_1.InteractionResponseType.DeferredChannelMessageWithSource,
            data: {
                flags,
            },
        });
    }
    static from(client, gateway, __reply) {
        switch (gateway.type) {
            case v10_1.InteractionType.ApplicationCommandAutocomplete:
                return new AutocompleteInteraction(client, gateway, undefined, __reply);
            // biome-ignore lint/suspicious/noFallthroughSwitchClause: bad interaction  between biome and ts-server
            case v10_1.InteractionType.ApplicationCommand:
                switch (gateway.data.type) {
                    case v10_1.ApplicationCommandType.ChatInput:
                        return new ChatInputCommandInteraction(client, gateway, __reply);
                    case v10_1.ApplicationCommandType.User:
                        return new UserCommandInteraction(client, gateway, __reply);
                    case v10_1.ApplicationCommandType.Message:
                        return new MessageCommandInteraction(client, gateway, __reply);
                }
            // biome-ignore lint/suspicious/noFallthroughSwitchClause: bad interaction  between biome and ts-server
            case v10_1.InteractionType.MessageComponent:
                switch (gateway.data.component_type) {
                    case v10_1.ComponentType.Button:
                        return new ButtonInteraction(client, gateway, __reply);
                    case v10_1.ComponentType.ChannelSelect:
                        return new ChannelSelectMenuInteraction(client, gateway, __reply);
                    case v10_1.ComponentType.RoleSelect:
                        return new RoleSelectMenuInteraction(client, gateway, __reply);
                    case v10_1.ComponentType.MentionableSelect:
                        return new MentionableSelectMenuInteraction(client, gateway, __reply);
                    case v10_1.ComponentType.UserSelect:
                        return new UserSelectMenuInteraction(client, gateway, __reply);
                    case v10_1.ComponentType.StringSelect:
                        return new StringSelectMenuInteraction(client, gateway, __reply);
                }
            case v10_1.InteractionType.ModalSubmit:
                return new ModalSubmitInteraction(client, gateway);
            default:
                return new BaseInteraction(client, gateway);
        }
    }
    fetchGuild(force = false) {
        return this.guildId ? this.client.guilds.fetch(this.guildId, force) : undefined;
    }
}
exports.BaseInteraction = BaseInteraction;
class AutocompleteInteraction extends BaseInteraction {
    __reply;
    options;
    constructor(client, interaction, resolver, __reply) {
        super(client, interaction);
        this.__reply = __reply;
        this.options =
            resolver ??
                transformers_1.Transformers.OptionResolver(client, interaction.data.options, undefined, interaction.guild_id, interaction.data.resolved);
    }
    getInput() {
        return this.options.getAutocompleteValue() ?? '';
    }
    respond(choices) {
        return super.reply({ data: { choices }, type: v10_1.InteractionResponseType.ApplicationCommandAutocompleteResult });
    }
    /** @intenal */
    async reply(..._args) {
        throw new Error('Cannot use reply in this interaction');
    }
}
exports.AutocompleteInteraction = AutocompleteInteraction;
class Interaction extends BaseInteraction {
    fetchMessage(messageId) {
        return this.client.interactions.fetchResponse(this.token, messageId);
    }
    fetchResponse() {
        return this.fetchMessage('@original');
    }
    async write(body, fetchReply) {
        (await this.reply({
            type: v10_1.InteractionResponseType.ChannelMessageWithSource,
            data: body,
        }));
        if (fetchReply)
            return this.fetchResponse();
        return undefined;
    }
    modal(body) {
        return this.reply({
            type: v10_1.InteractionResponseType.Modal,
            data: body,
        });
    }
    async editOrReply(body, fetchReply) {
        if (await this.replied) {
            const { content, embeds, allowed_mentions, components, files, attachments } = body;
            return this.editResponse({ content, embeds, allowed_mentions, components, files, attachments });
        }
        return this.write(body, fetchReply);
    }
    editMessage(messageId, body) {
        return this.client.interactions.editMessage(this.token, messageId, body);
    }
    editResponse(body) {
        return this.editMessage('@original', body);
    }
    deleteResponse() {
        return this.deleteMessage('@original');
    }
    deleteMessage(messageId) {
        return this.client.interactions.deleteResponse(this.id, this.token, messageId);
    }
    async followup(body) {
        return this.client.interactions.followup(this.token, body);
    }
}
exports.Interaction = Interaction;
class ApplicationCommandInteraction extends Interaction {
    type = v10_1.ApplicationCommandType.ChatInput;
    respond(data) {
        return this.reply(data);
    }
}
exports.ApplicationCommandInteraction = ApplicationCommandInteraction;
class ComponentInteraction extends Interaction {
    update(data) {
        return this.reply({
            type: v10_1.InteractionResponseType.UpdateMessage,
            data,
        });
    }
    deferUpdate() {
        return this.reply({
            type: v10_1.InteractionResponseType.DeferredMessageUpdate,
        });
    }
    get customId() {
        return this.data.customId;
    }
    get componentType() {
        return this.data.componentType;
    }
    isButton() {
        return this.data.componentType === v10_1.ComponentType.Button;
    }
    isChannelSelectMenu() {
        return this.componentType === v10_1.ComponentType.ChannelSelect;
    }
    isRoleSelectMenu() {
        return this.componentType === v10_1.ComponentType.RoleSelect;
    }
    isMentionableSelectMenu() {
        return this.componentType === v10_1.ComponentType.MentionableSelect;
    }
    isUserSelectMenu() {
        return this.componentType === v10_1.ComponentType.UserSelect;
    }
    isStringSelectMenu() {
        return this.componentType === v10_1.ComponentType.StringSelect;
    }
}
exports.ComponentInteraction = ComponentInteraction;
class ButtonInteraction extends ComponentInteraction {
}
exports.ButtonInteraction = ButtonInteraction;
class SelectMenuInteraction extends ComponentInteraction {
    __reply;
    constructor(client, interaction, __reply) {
        super(client, interaction);
        this.__reply = __reply;
    }
    get values() {
        return this.data.values;
    }
}
exports.SelectMenuInteraction = SelectMenuInteraction;
class StringSelectMenuInteraction extends SelectMenuInteraction {
}
exports.StringSelectMenuInteraction = StringSelectMenuInteraction;
class ChannelSelectMenuInteraction extends SelectMenuInteraction {
    __reply;
    channels;
    constructor(client, interaction, __reply) {
        super(client, interaction);
        this.__reply = __reply;
        const resolved = interaction.data.resolved;
        this.channels = this.values.map(x => (0, channels_1.default)(resolved.channels[x], this.client));
    }
}
exports.ChannelSelectMenuInteraction = ChannelSelectMenuInteraction;
class MentionableSelectMenuInteraction extends SelectMenuInteraction {
    __reply;
    roles;
    members;
    users;
    constructor(client, interaction, __reply) {
        super(client, interaction);
        this.__reply = __reply;
        const resolved = interaction.data.resolved;
        this.roles = resolved.roles
            ? this.values.map(x => transformers_1.Transformers.GuildRole(this.client, resolved.roles[x], this.guildId))
            : [];
        this.members = resolved.members
            ? this.values.map(x => transformers_1.Transformers.InteractionGuildMember(this.client, resolved.members[x], resolved.users[this.values.find(u => u === x)], this.guildId))
            : [];
        this.users = resolved.users ? this.values.map(x => transformers_1.Transformers.User(this.client, resolved.users[x])) : [];
    }
}
exports.MentionableSelectMenuInteraction = MentionableSelectMenuInteraction;
class RoleSelectMenuInteraction extends SelectMenuInteraction {
    __reply;
    roles;
    constructor(client, interaction, __reply) {
        super(client, interaction);
        this.__reply = __reply;
        const resolved = interaction.data.resolved;
        this.roles = this.values.map(x => transformers_1.Transformers.GuildRole(this.client, resolved.roles[x], this.guildId));
    }
}
exports.RoleSelectMenuInteraction = RoleSelectMenuInteraction;
class UserSelectMenuInteraction extends SelectMenuInteraction {
    __reply;
    members;
    users;
    constructor(client, interaction, __reply) {
        super(client, interaction);
        this.__reply = __reply;
        const resolved = interaction.data.resolved;
        this.users = this.values.map(x => transformers_1.Transformers.User(this.client, resolved.users[x]));
        this.members = resolved.members
            ? this.values.map(x => transformers_1.Transformers.InteractionGuildMember(this.client, resolved.members[x], resolved.users[this.values.find(u => u === x)], this.guildId))
            : [];
    }
}
exports.UserSelectMenuInteraction = UserSelectMenuInteraction;
class ChatInputCommandInteraction extends ApplicationCommandInteraction {
}
exports.ChatInputCommandInteraction = ChatInputCommandInteraction;
class UserCommandInteraction extends ApplicationCommandInteraction {
}
exports.UserCommandInteraction = UserCommandInteraction;
class MessageCommandInteraction extends ApplicationCommandInteraction {
}
exports.MessageCommandInteraction = MessageCommandInteraction;
let ModalSubmitInteraction = class ModalSubmitInteraction extends BaseInteraction {
    get customId() {
        return this.data.customId;
    }
    get components() {
        return this.data.components;
    }
    getInputValue(customId, required) {
        let value;
        for (const { components } of this.components) {
            const get = components.find(x => x.customId === customId);
            if (get) {
                value = get.value;
                break;
            }
        }
        if (!value && required)
            throw new Error(`${customId} component doesn't have a value`);
        return value;
    }
};
exports.ModalSubmitInteraction = ModalSubmitInteraction;
exports.ModalSubmitInteraction = ModalSubmitInteraction = __decorate([
    (0, ts_mixer_1.mix)(Interaction)
], ModalSubmitInteraction);
