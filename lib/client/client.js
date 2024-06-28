"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Client = void 0;
const v10_1 = require("discord-api-types/v10");
const common_1 = require("../common");
const events_1 = require("../events");
const websocket_1 = require("../websocket");
const memberUpdate_1 = require("../websocket/discord/events/memberUpdate");
const presenceUpdate_1 = require("../websocket/discord/events/presenceUpdate");
const base_1 = require("./base");
const collectors_1 = require("./collectors");
const transformers_1 = require("./transformers");
let parentPort;
class Client extends base_1.BaseClient {
    __handleGuilds = new Set();
    gateway;
    me;
    memberUpdateHandler = new memberUpdate_1.MemberUpdateHandler();
    presenceUpdateHandler = new presenceUpdate_1.PresenceUpdateHandler();
    collectors = new collectors_1.Collectors();
    events = new events_1.EventHandler(this);
    constructor(options) {
        super(options);
    }
    setServices({ gateway, ...rest }) {
        super.setServices(rest);
        if (gateway) {
            const onPacket = this.onPacket.bind(this);
            const oldFn = gateway.options.handlePayload;
            gateway.options.handlePayload = async (shardId, packet) => {
                await onPacket(shardId, packet);
                return oldFn(shardId, packet);
            };
            this.gateway = gateway;
        }
        if (rest.handlers && 'events' in rest.handlers) {
            if (!rest.handlers.events) {
                this.events = undefined;
            }
            else if (typeof rest.handlers.events === 'function') {
                this.events = new events_1.EventHandler(this);
            }
            else {
                this.events = rest.handlers.events;
            }
        }
    }
    async loadEvents(dir) {
        dir ??= await this.getRC().then(x => x.events);
        if (dir && this.events) {
            await this.events.load(dir);
            this.logger.info('EventHandler loaded');
        }
    }
    async execute(options = {}) {
        await super.execute(options);
        const worker_threads = (0, common_1.lazyLoadPackage)('node:worker_threads');
        if (worker_threads?.parentPort) {
            parentPort = worker_threads.parentPort;
        }
        if (worker_threads?.workerData?.__USING_WATCHER__) {
            parentPort?.on('message', (data) => {
                switch (data.type) {
                    case 'PAYLOAD':
                        this.gateway.options.handlePayload(data.shardId, data.payload);
                        break;
                    case 'SEND_TO_SHARD':
                        this.gateway.send(data.shardId, data.payload);
                        break;
                }
            });
        }
        else {
            await this.gateway.spawnShards();
        }
    }
    async start(options = {}, execute = true) {
        await super.start(options);
        await this.loadEvents(options.eventsDir);
        const { token: tokenRC, intents: intentsRC, debug: debugRC } = await this.getRC();
        const token = options?.token ?? tokenRC;
        const intents = options?.connection?.intents ?? intentsRC;
        if (!this.gateway) {
            base_1.BaseClient.assertString(token, 'token is not a string');
            this.gateway = new websocket_1.ShardManager({
                token,
                info: await this.proxy.gateway.bot.get(),
                intents,
                handlePayload: async (shardId, packet) => {
                    await this.options?.handlePayload?.(shardId, packet);
                    return this.onPacket(shardId, packet);
                },
                presence: this.options?.presence,
                debug: debugRC,
                shardStart: this.options?.shards?.start,
                shardEnd: this.options?.shards?.end ?? this.options?.shards?.total,
                totalShards: this.options?.shards?.total ?? this.options?.shards?.end,
                properties: {
                    ...websocket_1.properties,
                    ...this.options?.gateway?.properties,
                },
                compress: this.options?.gateway?.compress,
            });
        }
        this.cache.intents = this.gateway.options.intents;
        if (execute) {
            await this.execute(options.connection);
        }
        else {
            await super.execute(options);
        }
    }
    async onPacket(shardId, packet) {
        Promise.allSettled([
            this.events?.runEvent('RAW', this, packet, shardId, false),
            this.collectors.run('RAW', packet),
        ]); //ignore promise
        switch (packet.t) {
            //// Cases where we must obtain the old data before updating
            case 'GUILD_MEMBER_UPDATE':
                if (!this.memberUpdateHandler.check(packet.d)) {
                    return;
                }
                await this.events?.execute(packet.t, packet, this, shardId);
                break;
            case 'PRESENCE_UPDATE':
                if (!this.presenceUpdateHandler.check(packet.d)) {
                    return;
                }
                await this.events?.execute(packet.t, packet, this, shardId);
                break;
            case 'GUILD_CREATE': {
                if (this.__handleGuilds?.has(packet.d.id)) {
                    this.__handleGuilds.delete(packet.d.id);
                    if (!this.__handleGuilds.size && [...this.gateway.values()].every(shard => shard.data.session_id)) {
                        await this.events?.runEvent('BOT_READY', this, this.me, -1);
                    }
                    if (!this.__handleGuilds.size)
                        delete this.__handleGuilds;
                    return this.cache.onPacket(packet);
                }
                await this.events?.execute(packet.t, packet, this, shardId);
                break;
            }
            //rest of the events
            default: {
                await this.events?.execute(packet.t, packet, this, shardId);
                switch (packet.t) {
                    case 'INTERACTION_CREATE':
                        await this.handleCommand.interaction(packet.d, shardId);
                        break;
                    case 'MESSAGE_CREATE':
                        await this.handleCommand.message(packet.d, shardId);
                        break;
                    case 'READY':
                        if (!this.__handleGuilds)
                            this.__handleGuilds = new Set();
                        for (const g of packet.d.guilds) {
                            this.__handleGuilds.add(g.id);
                        }
                        this.botId = packet.d.user.id;
                        this.applicationId = packet.d.application.id;
                        this.me = transformers_1.Transformers.ClientUser(this, packet.d.user, packet.d.application);
                        if (!(this.__handleGuilds.size &&
                            (this.gateway.options.intents & v10_1.GatewayIntentBits.Guilds) === v10_1.GatewayIntentBits.Guilds)) {
                            if ([...this.gateway.values()].every(shard => shard.data.session_id)) {
                                await this.events?.runEvent('BOT_READY', this, this.me, -1);
                            }
                            delete this.__handleGuilds;
                        }
                        this.debugger?.debug(`#${shardId}[${packet.d.user.username}](${this.botId}) is online...`);
                        break;
                }
                break;
            }
        }
    }
}
exports.Client = Client;
