"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkerClient = void 0;
exports.generateShardInfo = generateShardInfo;
const v10_1 = require("discord-api-types/v10");
const node_crypto_1 = require("node:crypto");
const __1 = require("..");
const cache_1 = require("../cache");
const common_1 = require("../common");
const events_1 = require("../events");
const websocket_1 = require("../websocket");
const base_1 = require("./base");
const collectors_1 = require("./collectors");
const transformers_1 = require("./transformers");
let workerData;
let manager;
try {
    workerData = {
        debug: process.env.SEYFERT_WORKER_DEBUG === 'true',
        intents: Number.parseInt(process.env.SEYFERT_WORKER_INTENTS),
        path: process.env.SEYFERT_WORKER_PATH,
        shards: process.env.SEYFERT_WORKER_SHARDS.split(',').map(id => Number.parseInt(id)),
        token: process.env.SEYFERT_WORKER_TOKEN,
        workerId: Number.parseInt(process.env.SEYFERT_WORKER_WORKERID),
        workerProxy: process.env.SEYFERT_WORKER_WORKERPROXY === 'true',
    };
}
catch { }
class WorkerClient extends base_1.BaseClient {
    __handleGuilds = new Set();
    logger = new __1.Logger({
        name: `[Worker #${workerData.workerId}]`,
    });
    collectors = new collectors_1.Collectors();
    events = new events_1.EventHandler(this);
    me;
    promises = new Map();
    shards = new Map();
    constructor(options) {
        super(options);
        if (!process.env.SEYFERT_SPAWNING) {
            throw new Error('WorkerClient cannot spawn without manager');
        }
        this.postMessage({
            type: 'WORKER_START',
            workerId: workerData.workerId,
        });
        const worker_threads = (0, common_1.lazyLoadPackage)('node:worker_threads');
        if (worker_threads?.parentPort) {
            manager = worker_threads?.parentPort;
        }
        (manager ?? process).on('message', (data) => this.handleManagerMessages(data));
        this.setServices({
            cache: {
                adapter: new cache_1.WorkerAdapter(workerData),
                disabledCache: options?.disabledCache,
            },
        });
        if (workerData.debug) {
            this.debugger = new __1.Logger({
                name: `[Worker #${workerData.workerId}]`,
                logLevel: common_1.LogLevels.Debug,
            });
        }
        if (workerData.workerProxy) {
            this.setServices({
                rest: new __1.ApiHandler({
                    token: workerData.token,
                    workerProxy: true,
                    debug: workerData.debug,
                }),
            });
        }
    }
    get workerId() {
        return workerData.workerId;
    }
    get latency() {
        let acc = 0;
        this.shards.forEach(s => (acc += s.latency));
        return acc / this.shards.size;
    }
    setServices({ ...rest }) {
        super.setServices(rest);
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
    async start(options = {}) {
        await super.start(options);
        await this.loadEvents(options.eventsDir);
        this.cache.intents = workerData.intents;
    }
    async loadEvents(dir) {
        dir ??= await this.getRC().then(x => x.events);
        if (dir && this.events) {
            await this.events.load(dir);
            this.logger.info('EventHandler loaded');
        }
    }
    postMessage(body) {
        if (manager)
            return manager.postMessage(body);
        return process.send(body);
    }
    async handleManagerMessages(data) {
        switch (data.type) {
            case 'CACHE_RESULT':
                if (this.cache.adapter instanceof cache_1.WorkerAdapter && this.cache.adapter.promises.has(data.nonce)) {
                    const cacheData = this.cache.adapter.promises.get(data.nonce);
                    clearTimeout(cacheData.timeout);
                    cacheData.resolve(data.result);
                    this.cache.adapter.promises.delete(data.nonce);
                }
                break;
            case 'SEND_PAYLOAD':
                {
                    const shard = this.shards.get(data.shardId);
                    if (!shard) {
                        this.logger.fatal('Worker trying send payload by non-existent shard');
                        return;
                    }
                    await shard.send(true, {
                        ...data,
                    });
                    this.postMessage({
                        type: 'RESULT_PAYLOAD',
                        nonce: data.nonce,
                        workerId: this.workerId,
                    });
                }
                break;
            case 'ALLOW_CONNECT':
                {
                    const shard = this.shards.get(data.shardId);
                    if (!shard) {
                        this.logger.fatal('Worker trying connect non-existent shard');
                        return;
                    }
                    shard.options.presence = data.presence;
                    await shard.connect();
                }
                break;
            case 'SPAWN_SHARDS':
                {
                    const onPacket = this.onPacket.bind(this);
                    const handlePayload = this.options?.handlePayload?.bind(this);
                    const self = this;
                    for (const id of workerData.shards) {
                        let shard = this.shards.get(id);
                        if (!shard) {
                            shard = new websocket_1.Shard(id, {
                                token: workerData.token,
                                intents: workerData.intents,
                                info: data.info,
                                compress: data.compress,
                                debugger: this.debugger,
                                properties: {
                                    ...websocket_1.properties,
                                    ...this.options.gateway?.properties,
                                },
                                async handlePayload(shardId, payload) {
                                    await handlePayload?.(shardId, payload);
                                    await onPacket?.(payload, shardId);
                                    self.postMessage({
                                        workerId: workerData.workerId,
                                        shardId,
                                        type: 'RECEIVE_PAYLOAD',
                                        payload,
                                    });
                                },
                            });
                            this.shards.set(id, shard);
                        }
                        this.postMessage({
                            type: 'CONNECT_QUEUE',
                            shardId: id,
                            workerId: workerData.workerId,
                        });
                    }
                }
                break;
            case 'SHARD_INFO':
                {
                    const shard = this.shards.get(data.shardId);
                    if (!shard) {
                        this.logger.fatal('Worker trying get non-existent shard');
                        return;
                    }
                    this.postMessage({
                        ...generateShardInfo(shard),
                        nonce: data.nonce,
                        type: 'SHARD_INFO',
                        workerId: this.workerId,
                    });
                }
                break;
            case 'WORKER_INFO':
                {
                    this.postMessage({
                        shards: [...this.shards.values()].map(generateShardInfo),
                        workerId: workerData.workerId,
                        type: 'WORKER_INFO',
                        nonce: data.nonce,
                    });
                }
                break;
            case 'BOT_READY':
                await this.events?.runEvent('BOT_READY', this, this.me, -1);
                break;
            case 'API_RESPONSE':
                {
                    const promise = this.rest.workerPromises.get(data.nonce);
                    if (!promise)
                        return;
                    this.rest.workerPromises.delete(data.nonce);
                    if (data.error)
                        return promise.reject(data.error);
                    promise.resolve(data.response);
                }
                break;
            case 'EXECUTE_EVAL':
                {
                    let result;
                    try {
                        // biome-ignore lint/security/noGlobalEval: yes
                        result = await eval(`
					(${data.func})(this)
					`);
                    }
                    catch (e) {
                        result = e;
                    }
                    this.postMessage({
                        type: 'EVAL_RESPONSE',
                        response: result,
                        workerId: workerData.workerId,
                        nonce: data.nonce,
                    });
                }
                break;
            case 'EVAL_RESPONSE':
                {
                    const evalResponse = this.promises.get(data.nonce);
                    if (!evalResponse)
                        return;
                    this.promises.delete(data.nonce);
                    clearTimeout(evalResponse.timeout);
                    evalResponse.resolve(data.response);
                }
                break;
        }
    }
    generateNonce(large = true) {
        const uuid = (0, node_crypto_1.randomUUID)();
        const nonce = large ? uuid : uuid.split('-')[0];
        if (this.promises.has(nonce))
            return this.generateNonce(large);
        return nonce;
    }
    generateSendPromise(nonce, message = 'Timeout') {
        return new Promise((res, rej) => {
            const timeout = setTimeout(() => {
                this.promises.delete(nonce);
                rej(new Error(message));
            }, 60e3);
            this.promises.set(nonce, { resolve: res, timeout });
        });
    }
    tellWorker(workerId, func) {
        const nonce = this.generateNonce();
        this.postMessage({
            type: 'EVAL',
            func: func.toString(),
            toWorkerId: workerId,
            workerId: workerData.workerId,
            nonce,
        });
        return this.generateSendPromise(nonce);
    }
    async onPacket(packet, shardId) {
        Promise.allSettled([
            this.events?.runEvent('RAW', this, packet, shardId, false),
            this.collectors.run('RAW', packet),
        ]); //ignore promise
        switch (packet.t) {
            case 'GUILD_CREATE': {
                if (this.__handleGuilds?.has(packet.d.id)) {
                    this.__handleGuilds.delete(packet.d.id);
                    if (!this.__handleGuilds.size && [...this.shards.values()].every(shard => shard.data.session_id)) {
                        this.postMessage({
                            type: 'WORKER_READY',
                            workerId: this.workerId,
                        });
                        await this.events?.runEvent('WORKER_READY', this, this.me, -1);
                    }
                    if (!this.__handleGuilds.size)
                        delete this.__handleGuilds;
                    return this.cache.onPacket(packet);
                }
                await this.events?.execute(packet.t, packet, this, shardId);
                break;
            }
            default: {
                await this.events?.execute(packet.t, packet, this, shardId);
                switch (packet.t) {
                    case 'READY':
                        if (!this.__handleGuilds)
                            this.__handleGuilds = new Set();
                        for (const g of packet.d.guilds) {
                            this.__handleGuilds.add(g.id);
                        }
                        this.botId = packet.d.user.id;
                        this.applicationId = packet.d.application.id;
                        this.me = transformers_1.Transformers.ClientUser(this, packet.d.user, packet.d.application);
                        if (!(this.__handleGuilds.size && (workerData.intents & v10_1.GatewayIntentBits.Guilds) === v10_1.GatewayIntentBits.Guilds)) {
                            if ([...this.shards.values()].every(shard => shard.data.session_id)) {
                                this.postMessage({
                                    type: 'WORKER_READY',
                                    workerId: this.workerId,
                                });
                                await this.events?.runEvent('WORKER_READY', this, this.me, -1);
                            }
                            delete this.__handleGuilds;
                        }
                        this.debugger?.debug(`#${shardId} [${packet.d.user.username}](${this.botId}) is online...`);
                        break;
                    case 'INTERACTION_CREATE':
                        await this.handleCommand.interaction(packet.d, shardId);
                        break;
                    case 'MESSAGE_CREATE':
                        await this.handleCommand.message(packet.d, shardId);
                        break;
                }
                break;
            }
        }
    }
}
exports.WorkerClient = WorkerClient;
function generateShardInfo(shard) {
    return {
        open: shard.isOpen,
        shardId: shard.id,
        latency: shard.latency,
        resumable: shard.resumable,
    };
}
