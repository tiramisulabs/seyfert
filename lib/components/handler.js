"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComponentHandler = void 0;
const collection_1 = require("../collection");
const commands_1 = require("../commands");
const common_1 = require("../common");
const componentcommand_1 = require("./componentcommand");
const modalcommand_1 = require("./modalcommand");
class ComponentHandler extends common_1.BaseHandler {
    client;
    onFail = err => this.logger.warn('<Client>.components.onFail', err);
    values = new Map();
    // 10 minutes timeout, because discord dont send an event when the user cancel the modal
    modals = new collection_1.LimitedCollection({ expire: 60e3 * 10 });
    commands = [];
    filter = (path) => path.endsWith('.js') || (!path.endsWith('.d.ts') && path.endsWith('.ts'));
    constructor(logger, client) {
        super(logger);
        this.client = client;
    }
    createComponentCollector(messageId, options = {}) {
        this.values.set(messageId, {
            components: [],
            options,
            idle: options.idle && options.idle > 0
                ? setTimeout(() => {
                    this.deleteValue(messageId);
                    options.onStop?.('idle', () => {
                        this.createComponentCollector(messageId, options);
                    });
                }, options.idle)
                : undefined,
            timeout: options.timeout && options.timeout > 0
                ? setTimeout(() => {
                    this.deleteValue(messageId);
                    options.onStop?.('timeout', () => {
                        this.createComponentCollector(messageId, options);
                    });
                }, options.timeout)
                : undefined,
            __run: (customId, callback) => {
                if (this.values.has(messageId)) {
                    this.values.get(messageId).components.push({
                        callback,
                        match: customId,
                    });
                }
            },
        });
        return {
            //@ts-expect-error generic
            run: this.values.get(messageId).__run,
            stop: (reason) => {
                this.deleteValue(messageId);
                options.onStop?.(reason, () => {
                    this.createComponentCollector(messageId, options);
                });
            },
        };
    }
    async onComponent(id, interaction) {
        const row = this.values.get(id);
        const component = row?.components?.find(x => {
            if (typeof x.match === 'string')
                return x.match === interaction.customId;
            if (Array.isArray(x.match))
                return x.match.includes(interaction.customId);
            return interaction.customId.match(x.match);
        });
        if (!component)
            return;
        if (row.options?.filter) {
            if (!(await row.options.filter(interaction)))
                return;
        }
        row.idle?.refresh();
        await component.callback(interaction, reason => {
            row.options?.onStop?.(reason ?? 'stop');
            this.deleteValue(id);
        }, () => {
            this.resetTimeouts(id);
        });
    }
    hasComponent(id, customId) {
        return (this.values.get(id)?.components?.some(x => {
            if (typeof x.match === 'string')
                return x.match === customId;
            if (Array.isArray(x.match))
                return x.match.includes(customId);
            return customId.match(x.match);
        }) ?? false);
    }
    resetTimeouts(id) {
        const listener = this.values.get(id);
        if (listener) {
            listener.timeout?.refresh();
            listener.idle?.refresh();
        }
    }
    hasModal(interaction) {
        return this.modals.has(interaction.user.id);
    }
    onModalSubmit(interaction) {
        setImmediate(() => this.modals.delete(interaction.user.id));
        return this.modals.get(interaction.user.id)?.(interaction);
    }
    deleteValue(id, reason) {
        const component = this.values.get(id);
        if (component) {
            if (reason !== undefined)
                component.options?.onStop?.(reason);
            clearTimeout(component.timeout);
            clearTimeout(component.idle);
            this.values.delete(id);
        }
    }
    onMessageDelete(id) {
        this.deleteValue(id, 'messageDelete');
    }
    stablishDefaults(component) {
        component.props ??= this.client.options.commands?.defaults?.props ?? {};
        const is = component instanceof modalcommand_1.ModalCommand ? 'modals' : 'components';
        component.onInternalError ??= this.client.options?.[is]?.defaults?.onInternalError;
        component.onMiddlewaresError ??= this.client.options?.[is]?.defaults?.onMiddlewaresError;
        component.onRunError ??= this.client.options?.[is]?.defaults?.onRunError;
        component.onAfterRun ??= this.client.options?.[is]?.defaults?.onAfterRun;
    }
    async load(componentsDir) {
        const paths = await this.loadFilesK(await this.getFiles(componentsDir));
        for (const { components, file } of paths.map(x => ({ components: this.onFile(x.file), file: x }))) {
            if (!components)
                continue;
            for (const value of components) {
                let component;
                try {
                    component = this.callback(value);
                    if (!component)
                        continue;
                }
                catch (e) {
                    if (e instanceof Error && e.message.includes('is not a constructor')) {
                        this.logger.warn(`${file.path
                            .split(process.cwd())
                            .slice(1)
                            .join(process.cwd())} doesn't export the class by \`export default <ComponentCommand>\``);
                    }
                    else
                        this.logger.warn(e, value);
                    continue;
                }
                if (!(component instanceof modalcommand_1.ModalCommand || component instanceof componentcommand_1.ComponentCommand))
                    continue;
                this.stablishDefaults(component);
                component.__filePath = file.path;
                this.commands.push(component);
            }
        }
    }
    async reload(path) {
        if (!this.client.components)
            return;
        const component = this.client.components.commands.find(x => x.__filePath?.endsWith(`${path}.js`) ||
            x.__filePath?.endsWith(`${path}.ts`) ||
            x.__filePath?.endsWith(path) ||
            x.__filePath === path);
        if (!component?.__filePath)
            return null;
        delete require.cache[component.__filePath];
        const index = this.client.components.commands.findIndex(x => x.__filePath === component.__filePath);
        if (index === -1)
            return null;
        this.client.components.commands.splice(index, 1);
        const imported = await (0, common_1.magicImport)(component.__filePath).then(x => x.default ?? x);
        const command = new imported();
        command.__filePath = component.__filePath;
        this.client.components.commands.push(command);
        return imported;
    }
    async reloadAll(stopIfFail = true) {
        for (const i of this.commands) {
            try {
                await this.reload(i.__filePath ?? '');
            }
            catch (e) {
                if (stopIfFail) {
                    throw e;
                }
            }
        }
    }
    async execute(i, context) {
        try {
            const resultRunGlobalMiddlewares = await commands_1.BaseCommand.__runMiddlewares(context, (context.client.options?.globalMiddlewares ?? []), true);
            if (resultRunGlobalMiddlewares.pass) {
                return;
            }
            if ('error' in resultRunGlobalMiddlewares) {
                return i.onMiddlewaresError?.(context, resultRunGlobalMiddlewares.error ?? 'Unknown error');
            }
            const resultRunMiddlewares = await commands_1.BaseCommand.__runMiddlewares(context, i.middlewares, false);
            if (resultRunMiddlewares.pass) {
                return;
            }
            if ('error' in resultRunMiddlewares) {
                return i.onMiddlewaresError?.(context, resultRunMiddlewares.error ?? 'Unknown error');
            }
            try {
                await i.run(context);
                await i.onAfterRun?.(context, undefined);
            }
            catch (error) {
                await i.onRunError?.(context, error);
                await i.onAfterRun?.(context, error);
            }
        }
        catch (error) {
            try {
                await i.onInternalError?.(this.client, error);
            }
            catch (e) {
                // supress error
                this.logger.error(e);
            }
        }
    }
    async executeComponent(context) {
        for (const i of this.commands) {
            try {
                if (i.type === componentcommand_1.InteractionCommandType.COMPONENT &&
                    i.cType === context.interaction.componentType &&
                    (await i.filter(context))) {
                    context.command = i;
                    await this.execute(i, context);
                }
            }
            catch (e) {
                await this.onFail(e);
            }
        }
    }
    async executeModal(context) {
        for (const i of this.commands) {
            try {
                if (i.type === componentcommand_1.InteractionCommandType.MODAL && (await i.filter(context))) {
                    context.command = i;
                    await this.execute(i, context);
                }
            }
            catch (e) {
                await this.onFail(e);
            }
        }
    }
    onFile(file) {
        return file.default ? [file.default] : undefined;
    }
    callback(file) {
        return new file();
    }
}
exports.ComponentHandler = ComponentHandler;
