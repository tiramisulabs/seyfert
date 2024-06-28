"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContextMenuCommand = void 0;
const common_1 = require("../../common");
class ContextMenuCommand {
    middlewares = [];
    __filePath;
    __t;
    guildId;
    name;
    type;
    nsfw;
    integrationTypes = [];
    contexts = [];
    description;
    defaultMemberPermissions;
    botPermissions;
    dm;
    name_localizations;
    description_localizations;
    props = {};
    toJSON() {
        return {
            name: this.name,
            type: this.type,
            nsfw: this.nsfw,
            description: this.description,
            name_localizations: this.name_localizations,
            description_localizations: this.description_localizations,
            guild_id: this.guildId,
            dm_permission: this.dm,
            default_member_permissions: this.defaultMemberPermissions ? this.defaultMemberPermissions.toString() : undefined,
            contexts: this.contexts,
            integration_types: this.integrationTypes,
        };
    }
    async reload() {
        delete require.cache[this.__filePath];
        const __tempCommand = await (0, common_1.magicImport)(this.__filePath).then(x => x.default ?? x);
        Object.setPrototypeOf(this, __tempCommand.prototype);
    }
    onRunError(context, error) {
        context.client.logger.fatal(`${this.name}.<onRunError>`, context.author.id, error);
    }
    onMiddlewaresError(context, error) {
        context.client.logger.fatal(`${this.name}.<onMiddlewaresError>`, context.author.id, error);
    }
    onBotPermissionsFail(context, permissions) {
        context.client.logger.fatal(`${this.name}.<onBotPermissionsFail>`, context.author.id, permissions);
    }
    // onPermissionsFail(context: MenuCommandContext<any, never>, permissions: PermissionStrings): any {
    // 	context.client.logger.fatal(`${this.name}.<onPermissionsFail>`, context.author.id, permissions);
    // }
    onInternalError(client, command, error) {
        client.logger.fatal(command.name, error);
    }
}
exports.ContextMenuCommand = ContextMenuCommand;
