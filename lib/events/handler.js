"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventHandler = void 0;
const common_1 = require("../common");
const RawEvents = __importStar(require("../events/hooks"));
class EventHandler extends common_1.BaseHandler {
    client;
    constructor(client) {
        super(client.logger);
        this.client = client;
    }
    onFail = (event, err) => this.logger.warn('<Client>.events.onFail', err, event);
    filter = (path) => path.endsWith('.js') || (!path.endsWith('.d.ts') && path.endsWith('.ts'));
    values = {};
    async load(eventsDir) {
        const discordEvents = Object.keys(RawEvents).map(x => common_1.ReplaceRegex.camel(x.toLowerCase()));
        const paths = await this.loadFilesK(await this.getFiles(eventsDir));
        for (const { events, file } of paths.map(x => ({ events: this.onFile(x.file), file: x }))) {
            if (!events)
                continue;
            for (const i of events) {
                const instance = this.callback(i);
                if (!instance)
                    continue;
                if (typeof instance?.run !== 'function') {
                    this.logger.warn(file.path.split(process.cwd()).slice(1).join(process.cwd()), 'Missing run function, use `export default {...}` syntax');
                    continue;
                }
                instance.__filePath = file.path;
                this.values[discordEvents.includes(instance.data.name)
                    ? common_1.ReplaceRegex.snake(instance.data.name).toUpperCase()
                    : instance.data.name] = instance;
            }
        }
    }
    async execute(name, ...args) {
        switch (name) {
            case 'MESSAGE_CREATE':
                {
                    const { d: data } = args[0];
                    if (args[1].components?.values.has(data.interaction_metadata?.id ?? data.id)) {
                        args[1].components.values.get(data.interaction_metadata.id ?? data.id).messageId = data.id;
                    }
                }
                break;
            case 'MESSAGE_DELETE':
                {
                    const { d: data } = args[0];
                    const value = [...(args[1].components?.values ?? [])].find(x => x[1].messageId === data.id);
                    if (value) {
                        args[1].components.onMessageDelete(value[0]);
                    }
                }
                break;
            case 'MESSAGE_DELETE_BULK':
                {
                    const { d: data } = args[0];
                    const values = [...(args[1].components?.values ?? [])];
                    data.ids.forEach(id => {
                        const value = values.find(x => x[1].messageId === id);
                        if (value) {
                            args[1].components.onMessageDelete(value[0]);
                        }
                    });
                }
                break;
        }
        await Promise.all([
            this.runEvent(args[0].t, args[1], args[0].d, args[2]),
            this.client.collectors.run(args[0].t, args[0].d),
        ]);
    }
    async runEvent(name, client, packet, shardId, runCache = true) {
        const Event = this.values[name];
        if (!Event) {
            return runCache
                ? this.client.cache.onPacket({
                    t: name,
                    d: packet,
                })
                : undefined;
        }
        try {
            if (Event.data.once && Event.fired) {
                return runCache
                    ? this.client.cache.onPacket({
                        t: name,
                        d: packet,
                    })
                    : undefined;
            }
            Event.fired = true;
            const hook = await RawEvents[name]?.(client, packet);
            if (runCache)
                await this.client.cache.onPacket({
                    t: name,
                    d: packet,
                });
            await Event.run(hook, client, shardId);
        }
        catch (e) {
            await this.onFail(name, e);
        }
    }
    async runCustom(name, ...args) {
        const Event = this.values[name];
        if (!Event) {
            return this.client.collectors.run(name, args);
        }
        try {
            if (Event.data.once && Event.fired) {
                return this.client.collectors.run(name, args);
            }
            Event.fired = true;
            this.logger.debug(`executed a custom event [${name}]`, Event.data.once ? 'once' : '');
            await Promise.all([Event.run(args, this.client), this.client.collectors.run(name, args)]);
        }
        catch (e) {
            await this.onFail(name, e);
        }
    }
    async reload(name) {
        const event = this.values[name];
        if (!event?.__filePath)
            return null;
        delete require.cache[event.__filePath];
        const imported = await (0, common_1.magicImport)(event.__filePath).then(x => x.default ?? x);
        imported.__filePath = event.__filePath;
        this.values[name] = imported;
        return imported;
    }
    async reloadAll(stopIfFail = true) {
        for (const i in this.values) {
            try {
                await this.reload(i);
            }
            catch (e) {
                if (stopIfFail) {
                    throw e;
                }
            }
        }
    }
    onFile(file) {
        return file.default ? [file.default] : undefined;
    }
    callback = (file) => file;
}
exports.EventHandler = EventHandler;
