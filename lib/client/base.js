"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseClient = void 0;
const node_path_1 = require("node:path");
const api_1 = require("../api");
const cache_1 = require("../cache");
const shared_1 = require("../commands/applications/shared");
const handler_1 = require("../commands/handler");
const common_1 = require("../common");
const handler_2 = require("../components/handler");
const handler_3 = require("../langs/handler");
const node_fs_1 = require("node:fs");
const bans_1 = require("../common/shorters/bans");
const handle_1 = require("../commands/handle");
class BaseClient {
    rest;
    cache;
    users = new common_1.UsersShorter(this);
    channels = new common_1.ChannelShorter(this);
    guilds = new common_1.GuildShorter(this);
    messages = new common_1.MessageShorter(this);
    members = new common_1.MemberShorter(this);
    webhooks = new common_1.WebhookShorter(this);
    templates = new common_1.TemplateShorter(this);
    roles = new common_1.RoleShorter(this);
    reactions = new common_1.ReactionShorter(this);
    emojis = new common_1.EmojiShorter(this);
    threads = new common_1.ThreadShorter(this);
    bans = new bans_1.BanShorter(this);
    interactions = new common_1.InteractionShorter(this);
    debugger;
    logger = new common_1.Logger({
        name: '[Seyfert]',
    });
    langs = new handler_3.LangsHandler(this.logger);
    commands = new handler_1.CommandHandler(this.logger, this);
    components = new handler_2.ComponentHandler(this.logger, this);
    handleCommand;
    _applicationId;
    _botId;
    middlewares;
    static assertString(value, message) {
        if (!(typeof value === 'string' && value !== '')) {
            throw new Error(message ?? 'Value is not a string');
        }
    }
    static getBotIdFromToken(token) {
        return Buffer.from(token.split('.')[0], 'base64').toString('ascii');
    }
    options;
    /**@internal */
    static _seyfertConfig;
    constructor(options) {
        this.options = (0, common_1.MergeOptions)({
            commands: {
                defaults: {
                    onRunError(context, error) {
                        context.client.logger.fatal(`${context.command.name}.<onRunError>`, context.author.id, error);
                    },
                    onOptionsError(context, metadata) {
                        context.client.logger.fatal(`${context.command.name}.<onOptionsError>`, context.author.id, metadata);
                    },
                    onMiddlewaresError(context, error) {
                        context.client.logger.fatal(`${context.command.name}.<onMiddlewaresError>`, context.author.id, error);
                    },
                    onBotPermissionsFail(context, permissions) {
                        context.client.logger.fatal(`${context.command.name}.<onBotPermissionsFail>`, context.author.id, permissions);
                    },
                    onPermissionsFail(context, permissions) {
                        context.client.logger.fatal(`${context.command.name}.<onPermissionsFail>`, context.author.id, permissions);
                    },
                    onInternalError(client, command, error) {
                        client.logger.fatal(`${command.name}.<onInternalError>`, error);
                    },
                },
            },
            components: {
                defaults: {
                    onRunError(context, error) {
                        context.client.logger.fatal('ComponentCommand.<onRunError>', context.author.id, error);
                    },
                    onMiddlewaresError(context, error) {
                        context.client.logger.fatal('ComponentCommand.<onMiddlewaresError>', context.author.id, error);
                    },
                    onInternalError(client, error) {
                        client.logger.fatal(error);
                    },
                },
            },
            modals: {
                defaults: {
                    onRunError(context, error) {
                        context.client.logger.fatal('ComponentCommand.<onRunError>', context.author.id, error);
                    },
                    onMiddlewaresError(context, error) {
                        context.client.logger.fatal('ComponentCommand.<onMiddlewaresError>', context.author.id, error);
                    },
                    onInternalError(client, error) {
                        client.logger.fatal(error);
                    },
                },
            },
        }, options);
    }
    set botId(id) {
        this._botId = id;
    }
    get botId() {
        return this._botId ?? BaseClient.getBotIdFromToken(this.rest.options.token);
    }
    set applicationId(id) {
        this._applicationId = id;
    }
    get applicationId() {
        return this._applicationId ?? this.botId;
    }
    get proxy() {
        return new api_1.Router(this.rest).createProxy();
    }
    setServices({ rest, cache, langs, middlewares, handlers, handleCommand }) {
        if (rest) {
            this.rest = rest;
        }
        if (cache) {
            this.cache = new cache_1.Cache(this.cache?.intents ?? 0, cache?.adapter ?? this.cache?.adapter ?? new cache_1.MemoryAdapter(), cache.disabledCache ?? this.cache?.disabledCache ?? [], this);
        }
        if (middlewares) {
            this.middlewares = middlewares;
        }
        if (handlers) {
            if ('components' in handlers) {
                if (!handlers.components) {
                    this.components = undefined;
                }
                else if (typeof handlers.components === 'function') {
                    this.components ??= new handler_2.ComponentHandler(this.logger, this);
                }
                else {
                    this.components = handlers.components;
                }
            }
            if ('commands' in handlers) {
                if (!handlers.commands) {
                    this.commands = undefined;
                }
                else if (typeof handlers.commands === 'object') {
                    this.commands ??= new handler_1.CommandHandler(this.logger, this);
                }
                else {
                    this.commands = handlers.commands;
                }
            }
            if ('langs' in handlers) {
                if (!handlers.langs) {
                    this.langs = undefined;
                }
                else if (typeof handlers.langs === 'function') {
                    this.langs ??= new handler_3.LangsHandler(this.logger);
                }
                else {
                    this.langs = handlers.langs;
                }
            }
        }
        if (langs) {
            if (langs.default)
                this.langs.defaultLang = langs.default;
            if (langs.aliases)
                this.langs.aliases = Object.entries(langs.aliases);
        }
        if (handleCommand)
            this.handleCommand = new handleCommand(this);
    }
    async execute(..._options) {
        if ((await this.getRC()).debug) {
            this.debugger = new common_1.Logger({
                name: '[Debug]',
                logLevel: common_1.LogLevels.Debug,
            });
        }
    }
    async start(options = {
        token: undefined,
        langsDir: undefined,
        commandsDir: undefined,
        connection: undefined,
        componentsDir: undefined,
    }) {
        await this.loadLangs(options.langsDir);
        await this.loadCommands(options.commandsDir);
        await this.loadComponents(options.componentsDir);
        const { token: tokenRC } = await this.getRC();
        const token = options?.token ?? tokenRC;
        if (!this.rest) {
            BaseClient.assertString(token, 'token is not a string');
            this.rest = new api_1.ApiHandler({
                token,
                baseUrl: 'api/v10',
                domain: 'https://discord.com',
                debug: (await this.getRC()).debug,
            });
        }
        if (this.cache) {
            this.cache.__setClient(this);
        }
        else {
            this.cache = new cache_1.Cache(0, new cache_1.MemoryAdapter(), [], this);
        }
        if (!this.handleCommand)
            this.handleCommand = new handle_1.HandleCommand(this);
    }
    async onPacket(..._packet) {
        throw new Error('Function not implemented');
    }
    shouldUploadCommands(cachePath, guildId) {
        return this.commands.shouldUpload(cachePath, guildId).then(should => {
            this.logger.debug(should
                ? `[${guildId ?? 'global'}] Change(s) detected, uploading commands`
                : `[${guildId ?? 'global'}] commands seems to be up to date`);
            return should;
        });
    }
    syncCachePath(cachePath) {
        this.logger.debug('Syncing commands cache');
        return node_fs_1.promises.writeFile(cachePath, JSON.stringify(this.commands.values.filter(cmd => !('ignore' in cmd) || cmd.ignore !== shared_1.IgnoreCommand.Slash).map(x => x.toJSON())));
    }
    async uploadCommands({ applicationId, cachePath } = {}) {
        applicationId ??= await this.getRC().then(x => x.applicationId ?? this.applicationId);
        BaseClient.assertString(applicationId, 'applicationId is not a string');
        const commands = this.commands.values;
        const filter = (0, common_1.filterSplit)(commands, command => !command.guildId);
        if (!cachePath || (await this.shouldUploadCommands(cachePath)))
            await this.proxy.applications(applicationId).commands.put({
                body: filter.expect
                    .filter(cmd => !('ignore' in cmd) || cmd.ignore !== shared_1.IgnoreCommand.Slash)
                    .map(x => x.toJSON()),
            });
        const guilds = new Set();
        for (const command of filter.never) {
            for (const guild_id of command.guildId) {
                guilds.add(guild_id);
            }
        }
        for (const guildId of guilds) {
            if (!cachePath || (await this.shouldUploadCommands(cachePath, guildId))) {
                await this.proxy
                    .applications(applicationId)
                    .guilds(guildId)
                    .commands.put({
                    body: filter.never
                        .filter(cmd => cmd.guildId?.includes(guildId) && (!('ignore' in cmd) || cmd.ignore !== shared_1.IgnoreCommand.Slash))
                        .map(x => x.toJSON()),
                });
            }
        }
        if (cachePath)
            await this.syncCachePath(cachePath);
    }
    async loadCommands(dir) {
        dir ??= await this.getRC().then(x => x.commands);
        if (dir && this.commands) {
            await this.commands.load(dir, this);
            this.logger.info('CommandHandler loaded');
        }
    }
    async loadComponents(dir) {
        dir ??= await this.getRC().then(x => x.components);
        if (dir && this.components) {
            await this.components.load(dir);
            this.logger.info('ComponentHandler loaded');
        }
    }
    async loadLangs(dir) {
        dir ??= await this.getRC().then(x => x.langs);
        if (dir && this.langs) {
            await this.langs.load(dir);
            this.logger.info('LangsHandler loaded');
        }
    }
    t(locale) {
        return this.langs.get(locale);
    }
    async getRC() {
        const seyfertConfig = (BaseClient._seyfertConfig ||
            (await this.options?.getRC?.()) ||
            (await Promise.any(['.js', '.mjs', '.cjs', '.ts', '.mts', '.cts'].map(ext => (0, common_1.magicImport)((0, node_path_1.join)(process.cwd(), `seyfert.config${ext}`)).then(x => x.default ?? x)))));
        const { locations, debug, ...env } = seyfertConfig;
        const obj = {
            debug: !!debug,
            ...env,
            templates: locations.templates ? (0, node_path_1.join)(process.cwd(), locations.base, locations.templates) : undefined,
            langs: locations.langs ? (0, node_path_1.join)(process.cwd(), locations.output, locations.langs) : undefined,
            events: 'events' in locations && locations.events ? (0, node_path_1.join)(process.cwd(), locations.output, locations.events) : undefined,
            components: locations.components ? (0, node_path_1.join)(process.cwd(), locations.output, locations.components) : undefined,
            commands: locations.commands ? (0, node_path_1.join)(process.cwd(), locations.output, locations.commands) : undefined,
            base: (0, node_path_1.join)(process.cwd(), locations.base),
            output: (0, node_path_1.join)(process.cwd(), locations.output),
        };
        BaseClient._seyfertConfig = seyfertConfig;
        return obj;
    }
}
exports.BaseClient = BaseClient;
