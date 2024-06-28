"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Locales = Locales;
exports.LocalesT = LocalesT;
exports.GroupsT = GroupsT;
exports.Groups = Groups;
exports.Group = Group;
exports.Options = Options;
exports.AutoLoad = AutoLoad;
exports.Middlewares = Middlewares;
exports.Declare = Declare;
const v10_1 = require("discord-api-types/v10");
function Locales({ name: names, description: descriptions, }) {
    return (target) => class extends target {
        name_localizations = names ? Object.fromEntries(names) : undefined;
        description_localizations = descriptions ? Object.fromEntries(descriptions) : undefined;
    };
}
function LocalesT(name, description) {
    return (target) => class extends target {
        __t = { name, description };
    };
}
function GroupsT(groups) {
    return (target) => class extends target {
        __tGroups = groups;
        groupsAliases = {};
        constructor(...args) {
            super(...args);
            for (const i in groups) {
                for (const j of groups[i].aliases ?? []) {
                    this.groupsAliases[j] = i;
                }
            }
        }
    };
}
function Groups(groups) {
    return (target) => class extends target {
        groups = groups;
        groupsAliases = {};
        constructor(...args) {
            super(...args);
            for (const i in groups) {
                for (const j of groups[i].aliases ?? []) {
                    this.groupsAliases[j] = i;
                }
            }
        }
    };
}
function Group(groupName) {
    return (target) => class extends target {
        group = groupName;
    };
}
function Options(options) {
    return (target) => class extends target {
        options = Array.isArray(options)
            ? options.map(x => new x())
            : Object.entries(options).map(([name, option]) => {
                return {
                    name,
                    ...option,
                };
            });
    };
}
function AutoLoad() {
    return (target) => class extends target {
        __autoload = true;
    };
}
function Middlewares(cbs) {
    return (target) => class extends target {
        middlewares = cbs;
    };
}
function Declare(declare) {
    return (target) => class extends target {
        name = declare.name;
        nsfw = declare.nsfw;
        props = declare.props;
        contexts = declare.contexts?.map(i => v10_1.InteractionContextType[i]) ??
            Object.values(v10_1.InteractionContextType).filter(x => typeof x === 'number');
        integrationTypes = declare.integrationTypes?.map(i => v10_1.ApplicationIntegrationType[i]) ?? [
            v10_1.ApplicationIntegrationType.GuildInstall,
        ];
        defaultMemberPermissions = Array.isArray(declare.defaultMemberPermissions)
            ? declare.defaultMemberPermissions?.reduce((acc, prev) => acc | v10_1.PermissionFlagsBits[prev], BigInt(0))
            : declare.defaultMemberPermissions;
        botPermissions = Array.isArray(declare.botPermissions)
            ? declare.botPermissions?.reduce((acc, prev) => acc | v10_1.PermissionFlagsBits[prev], BigInt(0))
            : declare.botPermissions;
        description = '';
        type = v10_1.ApplicationCommandType.ChatInput;
        guildId;
        ignore;
        aliases;
        constructor(...args) {
            super(...args);
            if ('description' in declare)
                this.description = declare.description;
            if ('type' in declare)
                this.type = declare.type;
            if ('guildId' in declare)
                this.guildId = declare.guildId;
            if ('ignore' in declare)
                this.ignore = declare.ignore;
            if ('aliases' in declare)
                this.aliases = declare.aliases;
            // check if all properties are valid
        }
    };
}
