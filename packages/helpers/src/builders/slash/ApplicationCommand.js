"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatInputApplicationCommandBuilder = exports.MessageApplicationCommandBuilder = exports.ApplicationCommandBuilder = void 0;
const api_types_1 = require("@biscuitland/api-types");
const ApplicationCommandOption_1 = require("./ApplicationCommandOption");
class ApplicationCommandBuilder {
    constructor(type = api_types_1.ApplicationCommandTypes.ChatInput, name = '', description = '', defaultMemberPermissions, nameLocalizations, descriptionLocalizations, dmPermission = true) {
        this.type = type;
        this.name = name;
        this.description = description;
        this.defaultMemberPermissions = defaultMemberPermissions;
        this.nameLocalizations = nameLocalizations;
        this.descriptionLocalizations = descriptionLocalizations;
        this.dmPermission = dmPermission;
    }
    setType(type) {
        return (this.type = type), this;
    }
    setName(name) {
        return (this.name = name), this;
    }
    setDescription(description) {
        return (this.description = description), this;
    }
    setDefaultMemberPermission(perm) {
        return (this.defaultMemberPermissions = perm), this;
    }
    setNameLocalizations(l) {
        return (this.nameLocalizations = l), this;
    }
    setDescriptionLocalizations(l) {
        return (this.descriptionLocalizations = l), this;
    }
    setDmPermission(perm) {
        return (this.dmPermission = perm), this;
    }
}
exports.ApplicationCommandBuilder = ApplicationCommandBuilder;
class MessageApplicationCommandBuilder {
    constructor(type, name) {
        this.type = type ?? api_types_1.ApplicationCommandTypes.Message;
        this.name = name;
    }
    setName(name) {
        return (this.name = name), this;
    }
    toJSON() {
        if (!this.name) {
            throw new TypeError("Propety 'name' is required");
        }
        return {
            type: api_types_1.ApplicationCommandTypes.Message,
            name: this.name
        };
    }
}
exports.MessageApplicationCommandBuilder = MessageApplicationCommandBuilder;
class ChatInputApplicationCommandBuilder extends ApplicationCommandBuilder {
    constructor() {
        super(...arguments);
        this.type = api_types_1.ApplicationCommandTypes.ChatInput;
    }
    toJSON() {
        if (!this.type) {
            throw new TypeError("Propety 'type' is required");
        }
        if (!this.name) {
            throw new TypeError("Propety 'name' is required");
        }
        if (!this.description) {
            throw new TypeError("Propety 'description' is required");
        }
        return {
            type: api_types_1.ApplicationCommandTypes.ChatInput,
            name: this.name,
            description: this.description,
            options: this.options?.map(o => o.toJSON()) ?? [],
            default_member_permissions: this.defaultMemberPermissions,
            name_localizations: this.nameLocalizations,
            description_localizations: this.descriptionLocalizations,
            dm_permission: this.dmPermission
        };
    }
}
exports.ChatInputApplicationCommandBuilder = ChatInputApplicationCommandBuilder;
ApplicationCommandOption_1.OptionBased.applyTo(ChatInputApplicationCommandBuilder);
