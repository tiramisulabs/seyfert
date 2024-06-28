"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubCommand = exports.Command = exports.BaseCommand = void 0;
const v10_1 = require("discord-api-types/v10");
const common_1 = require("../../common");
const node_util_1 = require("node:util");
class BaseCommand {
    middlewares = [];
    __filePath;
    __t;
    __autoload;
    guildId;
    name;
    type; // ApplicationCommandType.ChatInput | ApplicationCommandOptionType.Subcommand
    nsfw;
    description;
    defaultMemberPermissions;
    integrationTypes = [];
    contexts = [];
    botPermissions;
    name_localizations;
    description_localizations;
    options;
    ignore;
    aliases;
    props = {};
    /** @internal */
    async __runOptions(ctx, resolver) {
        if (!this?.options?.length) {
            return [false, {}];
        }
        const data = {};
        let errored = false;
        for (const i of this.options ?? []) {
            try {
                const option = this.options.find(x => x.name === i.name);
                const value = resolver.getHoisted(i.name)?.value !== undefined
                    ? await new Promise(
                    // biome-ignore lint/suspicious/noAsyncPromiseExecutor: yes
                    async (res, rej) => {
                        try {
                            (await option.value?.({ context: ctx, value: resolver.getValue(i.name) }, res, rej)) ||
                                res(resolver.getValue(i.name));
                        }
                        catch (e) {
                            rej(e);
                        }
                    })
                    : undefined;
                if (value === undefined) {
                    if (option.required) {
                        errored = true;
                        data[i.name] = {
                            failed: true,
                            value: `${i.name} is required but returned no value`,
                            parseError: undefined,
                        };
                        continue;
                    }
                }
                // @ts-expect-error
                ctx.options[i.name] = value;
                data[i.name] = {
                    failed: false,
                    value,
                };
            }
            catch (e) {
                errored = true;
                data[i.name] = {
                    failed: true,
                    value: e instanceof Error ? e.message : typeof e === 'string' ? e : (0, node_util_1.inspect)(e),
                    parseError: undefined,
                };
            }
        }
        return [errored, data];
    }
    /** @internal */
    static __runMiddlewares(context, middlewares, global) {
        if (!middlewares.length) {
            return Promise.resolve({});
        }
        let index = 0;
        return new Promise(res => {
            let running = true;
            const pass = () => {
                if (!running) {
                    return;
                }
                running = false;
                return res({ pass: true });
            };
            function next(obj) {
                if (!running) {
                    return;
                }
                // biome-ignore lint/style/noArguments: yes
                // biome-ignore lint/correctness/noUndeclaredVariables: xd
                if (arguments.length) {
                    // @ts-expect-error
                    context[global ? 'globalMetadata' : 'metadata'][middlewares[index]] = obj;
                }
                if (++index >= middlewares.length) {
                    running = false;
                    return res({});
                }
                context.client.middlewares[middlewares[index]]({ context, next, stop, pass });
            }
            const stop = err => {
                if (!running) {
                    return;
                }
                running = false;
                return res({ error: err });
            };
            context.client.middlewares[middlewares[0]]({ context, next, stop, pass });
        });
    }
    /** @internal */
    __runMiddlewares(context) {
        return BaseCommand.__runMiddlewares(context, this.middlewares, false);
    }
    /** @internal */
    __runGlobalMiddlewares(context) {
        return BaseCommand.__runMiddlewares(context, (context.client.options?.globalMiddlewares ?? []), true);
    }
    toJSON() {
        const data = {
            name: this.name,
            type: this.type,
            nsfw: !!this.nsfw,
            description: this.description,
            name_localizations: this.name_localizations,
            description_localizations: this.description_localizations,
            guild_id: this.guildId,
            default_member_permissions: this.defaultMemberPermissions ? this.defaultMemberPermissions.toString() : undefined,
            contexts: this.contexts,
            integration_types: this.integrationTypes,
        };
        return data;
    }
    async reload() {
        delete require.cache[this.__filePath];
        for (const i of this.options ?? []) {
            if (i instanceof SubCommand && i.__filePath) {
                await i.reload();
            }
        }
        const __tempCommand = await (0, common_1.magicImport)(this.__filePath).then(x => x.default ?? x);
        Object.setPrototypeOf(this, __tempCommand.prototype);
    }
}
exports.BaseCommand = BaseCommand;
class Command extends BaseCommand {
    type = v10_1.ApplicationCommandType.ChatInput;
    groups;
    groupsAliases;
    __tGroups;
    toJSON() {
        const options = [];
        for (const i of this.options ?? []) {
            if (!(i instanceof SubCommand)) {
                options.push({ ...i, autocomplete: 'autocomplete' in i });
                continue;
            }
            if (i.group) {
                if (!options.find(x => x.name === i.group)) {
                    options.push({
                        type: v10_1.ApplicationCommandOptionType.SubcommandGroup,
                        name: i.group,
                        description: this.groups[i.group].defaultDescription,
                        description_localizations: Object.fromEntries(this.groups?.[i.group].description ?? []),
                        name_localizations: Object.fromEntries(this.groups?.[i.group].name ?? []),
                        options: [],
                    });
                }
                const group = options.find(x => x.name === i.group);
                group.options?.push(i.toJSON());
                continue;
            }
            options.push(i.toJSON());
        }
        return {
            ...super.toJSON(),
            options,
        };
    }
}
exports.Command = Command;
class SubCommand extends BaseCommand {
    type = v10_1.ApplicationCommandOptionType.Subcommand;
    group;
    toJSON() {
        return {
            ...super.toJSON(),
            options: this.options?.map(x => ({ ...x, autocomplete: 'autocomplete' in x })) ?? [],
        };
    }
}
exports.SubCommand = SubCommand;
