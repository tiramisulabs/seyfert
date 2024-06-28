"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OptionResolver = void 0;
const v10_1 = require("discord-api-types/v10");
const __1 = require("..");
const channels_1 = __importDefault(require("../structures/channels"));
const transformers_1 = require("../client/transformers");
class OptionResolver {
    client;
    parent;
    guildId;
    resolved;
    options;
    hoistedOptions;
    subCommand = null;
    group = null;
    constructor(client, options, parent, guildId, resolved) {
        this.client = client;
        this.parent = parent;
        this.guildId = guildId;
        this.resolved = resolved;
        this.hoistedOptions = this.options = options.map(option => this.transformOption(option, resolved));
        if (this.hoistedOptions[0]?.type === v10_1.ApplicationCommandOptionType.Subcommand) {
            this.subCommand = this.hoistedOptions[0].name;
            this.hoistedOptions = this.hoistedOptions[0].options ?? [];
        }
        if (this.hoistedOptions[0]?.type === v10_1.ApplicationCommandOptionType.SubcommandGroup) {
            this.group = this.hoistedOptions[0].name;
            this.subCommand = this.hoistedOptions[0].options[0].name;
            this.hoistedOptions = this.hoistedOptions[0].options[0].options ?? [];
        }
    }
    get fullCommandName() {
        return `${this.parent?.name}${this.group ? ` ${this.group} ${this.subCommand}` : this.subCommand ? ` ${this.subCommand}` : ''}`;
    }
    getCommand() {
        if (this.subCommand) {
            return this.parent?.options?.find(x => (this.group ? x.group === this.group : true) && x.name === this.subCommand);
        }
        return this.parent;
    }
    getAutocompleteValue() {
        return this.hoistedOptions.find(option => option.focused)?.value;
    }
    getAutocomplete() {
        return (this.getCommand()?.options).find(option => option.name === this.hoistedOptions.find(x => x.focused)?.name);
    }
    getParent() {
        return this.parent?.name;
    }
    getSubCommand() {
        return this.subCommand;
    }
    getGroup() {
        return this.group;
    }
    get(name) {
        return this.options.find(opt => opt.name === name);
    }
    getHoisted(name) {
        return this.hoistedOptions.find(x => x.name === name);
    }
    getValue(name) {
        const option = this.getHoisted(name);
        if (!option) {
            return;
        }
        switch (option.type) {
            case v10_1.ApplicationCommandOptionType.Attachment:
                return option.attachment;
            case v10_1.ApplicationCommandOptionType.Boolean:
                return option.value;
            case v10_1.ApplicationCommandOptionType.Channel:
                return option.channel;
            case v10_1.ApplicationCommandOptionType.Integer:
            case v10_1.ApplicationCommandOptionType.Number:
                return option.value;
            case v10_1.ApplicationCommandOptionType.Role:
                return option.role;
            case v10_1.ApplicationCommandOptionType.String:
                return option.value;
            case v10_1.ApplicationCommandOptionType.User:
                return option.member ?? option.user;
            case v10_1.ApplicationCommandOptionType.Mentionable:
                return option.member ?? option.user ?? option.role;
            default:
                return;
        }
    }
    getTypedOption(name, allow) {
        const option = this.getHoisted(name);
        if (!option) {
            throw new Error('Bad Option');
        }
        if (!allow.includes(option.type)) {
            throw new Error('Bad Option');
        }
        return option;
    }
    getChannel(name) {
        const option = this.getTypedOption(name, [v10_1.ApplicationCommandOptionType.Channel]);
        return option.channel;
    }
    getString(name) {
        const option = this.getTypedOption(name, [v10_1.ApplicationCommandOptionType.String]);
        return option.value;
    }
    transformOption(option, resolved) {
        const resolve = {
            ...option,
        };
        if ('value' in option) {
            resolve.value = option.value;
        }
        if ('options' in option) {
            resolve.options = option.options?.map(x => this.transformOption(x, resolved));
        }
        if (resolved) {
            const value = resolve.value;
            const user = resolved.users?.[value];
            if (user) {
                resolve.user = transformers_1.Transformers.User(this.client, user);
            }
            const member = resolved.members?.[value];
            if (member) {
                resolve.member =
                    'permissions' in member
                        ? transformers_1.Transformers.InteractionGuildMember(this.client, member, user, this.guildId)
                        : transformers_1.Transformers.GuildMember(this.client, member, user, this.guildId);
            }
            const channel = resolved.channels?.[value];
            if (channel) {
                resolve.channel = 'fetch' in channel ? channel : (0, channels_1.default)(channel, this.client);
            }
            const role = resolved.roles?.[value];
            if (role) {
                resolve.role = transformers_1.Transformers.GuildRole(this.client, role, this.guildId);
            }
            const attachment = resolved.attachments?.[value];
            if (attachment) {
                resolve.attachment = attachment instanceof __1.Attachment ? attachment : new __1.Attachment(this.client, attachment);
            }
        }
        return resolve;
    }
}
exports.OptionResolver = OptionResolver;
