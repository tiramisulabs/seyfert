"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkerManager = void 0;
const node_cluster_1 = __importDefault(require("node:cluster"));
const node_crypto_1 = require("node:crypto");
const __1 = require("../..");
const cache_1 = require("../../cache");
const base_1 = require("../../client/base");
const common_1 = require("../../common");
const constants_1 = require("../constants");
const structures_1 = require("../structures");
const timeout_1 = require("../structures/timeout");
const memberUpdate_1 = require("./events/memberUpdate");
const presenceUpdate_1 = require("./events/presenceUpdate");
class WorkerManager extends Map {
    options;
    debugger;
    connectQueue;
    cacheAdapter;
    promises = new Map();
    memberUpdateHandler = new memberUpdate_1.MemberUpdateHandler();
    presenceUpdateHandler = new presenceUpdate_1.PresenceUpdateHandler();
    rest;
    constructor(options) {
        super();
        this.options = options;
        this.cacheAdapter = new cache_1.MemoryAdapter();
    }
    setCache(adapter) {
        this.cacheAdapter = adapter;
    }
    setRest(rest) {
        this.rest = rest;
    }
    get remaining() {
        return this.options.info.session_start_limit.remaining;
    }
    get concurrency() {
        return this.options.info.session_start_limit.max_concurrency;
    }
    get totalWorkers() {
        return this.options.workers;
    }
    get totalShards() {
        return this.options.totalShards ?? this.options.info.shards;
    }
    get shardStart() {
        return this.options.shardStart ?? 0;
    }
    get shardEnd() {
        return this.options.shardEnd ?? this.totalShards;
    }
    get shardsPerWorker() {
        return this.options.shardsPerWorker;
    }
    get workers() {
        return this.options.workers;
    }
    async syncLatency({ shardId, workerId }) {
        if (typeof shardId !== 'number' && typeof workerId !== 'number') {
            return;
        }
        const id = workerId ?? this.calculateWorkerId(shardId);
        if (!this.has(id)) {
            throw new Error(`Worker #${workerId} doesnt exist`);
        }
        const data = await this.getWorkerInfo(id);
        return data.shards.reduce((acc, prv) => acc + prv.latency, 0) / data.shards.length;
    }
    calculateShardId(guildId) {
        return Number((BigInt(guildId) >> 22n) % BigInt(this.totalShards));
    }
    calculateWorkerId(shardId) {
        const workerId = Math.floor((shardId - this.shardStart) / this.shardsPerWorker);
        if (workerId >= this.workers) {
            throw new Error('Invalid shardId');
        }
        return workerId;
    }
    prepareSpaces() {
        this.debugger?.info('Preparing buckets');
        const chunks = structures_1.DynamicBucket.chunk(new Array(this.shardEnd - this.shardStart), this.options.shardsPerWorker);
        chunks.forEach((shards, index) => {
            for (let i = 0; i < shards.length; i++) {
                const id = i + (index > 0 ? index * this.options.shardsPerWorker : 0) + this.shardStart;
                chunks[index][i] = id;
            }
        });
        this.debugger?.info(`${chunks.length} buckets created`);
        return chunks;
    }
    postMessage(id, body) {
        const worker = this.get(id);
        if (!worker)
            return this.debugger?.error(`Worker ${id} doesnt exists.`);
        switch (this.options.mode) {
            case 'clusters':
                worker.send(body);
                break;
            case 'threads':
                worker.postMessage(body);
                break;
        }
    }
    async prepareWorkers(shards) {
        for (let i = 0; i < shards.length; i++) {
            let worker = this.get(i);
            if (!worker) {
                worker = this.createWorker({
                    path: this.options.path,
                    debug: this.options.debug,
                    token: this.options.token,
                    shards: shards[i],
                    intents: this.options.intents,
                    workerId: i,
                    workerProxy: this.options.workerProxy,
                });
                this.set(i, worker);
            }
            const listener = (message) => {
                if (message.type !== 'WORKER_START')
                    return;
                worker.removeListener('message', listener);
                this.postMessage(i, {
                    type: 'SPAWN_SHARDS',
                    compress: this.options.compress ?? false,
                    info: {
                        ...this.options.info,
                        shards: this.totalShards,
                    },
                    properties: this.options.properties,
                });
            };
            worker.on('message', listener);
        }
    }
    createWorker(workerData) {
        const worker_threads = (0, common_1.lazyLoadPackage)('node:worker_threads');
        if (!worker_threads)
            throw new Error('Cannot create worker without worker_threads.');
        const env = {
            SEYFERT_SPAWNING: 'true',
        };
        for (const i in workerData) {
            env[`SEYFERT_WORKER_${i.toUpperCase()}`] = workerData[i];
        }
        switch (this.options.mode) {
            case 'threads': {
                const worker = new worker_threads.Worker(workerData.path, {
                    env,
                });
                worker.on('message', data => this.handleWorkerMessage(data));
                return worker;
            }
            case 'clusters': {
                node_cluster_1.default.setupPrimary({
                    exec: workerData.path,
                });
                const worker = node_cluster_1.default.fork(env);
                worker.on('message', data => this.handleWorkerMessage(data));
                return worker;
            }
        }
    }
    spawn(workerId, shardId) {
        this.connectQueue.push(() => {
            const worker = this.get(workerId);
            if (!worker) {
                this.debugger?.fatal("Trying spawn with worker doesn't exist");
                return;
            }
            this.postMessage(workerId, {
                type: 'ALLOW_CONNECT',
                shardId,
                presence: this.options.presence?.(shardId, workerId),
            });
        });
    }
    async handleWorkerMessage(message) {
        switch (message.type) {
            case 'CONNECT_QUEUE':
                this.spawn(message.workerId, message.shardId);
                break;
            case 'CACHE_REQUEST':
                {
                    const worker = this.get(message.workerId);
                    if (!worker) {
                        throw new Error('Invalid request from unavailable worker');
                    }
                    // @ts-expect-error
                    const result = await this.cacheAdapter[message.method](...message.args);
                    this.postMessage(message.workerId, {
                        type: 'CACHE_RESULT',
                        nonce: message.nonce,
                        result,
                    });
                }
                break;
            case 'RECEIVE_PAYLOAD':
                {
                    switch (message.payload.t) {
                        case 'GUILD_MEMBER_UPDATE':
                            if (!this.memberUpdateHandler.check(message.payload.d)) {
                                return;
                            }
                            break;
                        case 'PRESENCE_UPDATE':
                            if (!this.presenceUpdateHandler.check(message.payload.d)) {
                                return;
                            }
                            break;
                    }
                    this.options.handlePayload(message.shardId, message.workerId, message.payload);
                }
                break;
            case 'RESULT_PAYLOAD':
                {
                    const resultPayload = this.promises.get(message.nonce);
                    if (!resultPayload) {
                        return;
                    }
                    this.promises.delete(message.nonce);
                    clearTimeout(resultPayload.timeout);
                    resultPayload.resolve(true);
                }
                break;
            case 'SHARD_INFO':
                {
                    const { nonce, type, ...data } = message;
                    const shardInfo = this.promises.get(nonce);
                    if (!shardInfo) {
                        return;
                    }
                    this.promises.delete(nonce);
                    clearTimeout(shardInfo.timeout);
                    shardInfo.resolve(data);
                }
                break;
            case 'WORKER_INFO':
                {
                    const { nonce, type, ...data } = message;
                    const workerInfo = this.promises.get(nonce);
                    if (!workerInfo) {
                        return;
                    }
                    this.promises.delete(nonce);
                    clearTimeout(workerInfo.timeout);
                    workerInfo.resolve(data);
                }
                break;
            case 'WORKER_READY':
                {
                    this.get(message.workerId).ready = true;
                    if ([...this.values()].every(w => w.ready)) {
                        this.postMessage(this.keys().next().value, {
                            type: 'BOT_READY',
                        });
                        this.forEach(w => {
                            delete w.ready;
                        });
                    }
                }
                break;
            case 'WORKER_API_REQUEST':
                {
                    const response = await this.rest.request(message.method, message.url, message.requestOptions);
                    this.postMessage(message.workerId, {
                        nonce: message.nonce,
                        response,
                        type: 'API_RESPONSE',
                    });
                }
                break;
            case 'EVAL_RESPONSE':
                {
                    const { nonce, type, ...data } = message;
                    const evalResponse = this.promises.get(nonce);
                    if (!evalResponse) {
                        return;
                    }
                    this.promises.delete(nonce);
                    clearTimeout(evalResponse.timeout);
                    evalResponse.resolve(data.response);
                }
                break;
            case 'EVAL':
                {
                    const nonce = this.generateNonce();
                    this.postMessage(message.toWorkerId, {
                        nonce,
                        func: message.func,
                        type: 'EXECUTE_EVAL',
                        toWorkerId: message.toWorkerId,
                    });
                    this.generateSendPromise(nonce, 'Eval timeout').then(val => this.postMessage(message.workerId, {
                        nonce: message.nonce,
                        response: val,
                        type: 'EVAL_RESPONSE',
                    }));
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
    async send(data, shardId) {
        const workerId = this.calculateWorkerId(shardId);
        const worker = this.get(workerId);
        if (!worker) {
            throw new Error(`Worker #${workerId} doesnt exist`);
        }
        const nonce = this.generateNonce();
        this.postMessage(workerId, {
            type: 'SEND_PAYLOAD',
            shardId,
            nonce,
            ...data,
        });
        return this.generateSendPromise(nonce, 'Shard send payload timeout');
    }
    async getShardInfo(shardId) {
        const workerId = this.calculateWorkerId(shardId);
        const worker = this.get(workerId);
        if (!worker) {
            throw new Error(`Worker #${workerId} doesnt exist`);
        }
        const nonce = this.generateNonce(false);
        this.postMessage(workerId, { shardId, nonce, type: 'SHARD_INFO' });
        return this.generateSendPromise(nonce, 'Get shard info timeout');
    }
    async getWorkerInfo(workerId) {
        const worker = this.get(workerId);
        if (!worker) {
            throw new Error(`Worker #${workerId} doesnt exist`);
        }
        const nonce = this.generateNonce();
        this.postMessage(workerId, { nonce, type: 'WORKER_INFO' });
        return this.generateSendPromise(nonce, 'Get worker info timeout');
    }
    async start() {
        const rc = await base_1.BaseClient.prototype.getRC();
        this.options.debug ||= rc.debug;
        this.options.intents ||= rc.intents ?? 0;
        this.options.token ??= rc.token;
        this.rest ??= new __1.ApiHandler({
            token: this.options.token,
            baseUrl: 'api/v10',
            domain: 'https://discord.com',
            debug: this.options.debug,
        });
        this.options.info ??= await new __1.Router(this.rest).createProxy().gateway.bot.get();
        this.options.shardEnd ??= this.options.totalShards ?? this.options.info.shards;
        this.options.totalShards ??= this.options.shardEnd;
        this.options = (0, common_1.MergeOptions)(constants_1.WorkerManagerDefaults, this.options);
        this.options.workers ??= Math.ceil(this.options.totalShards / this.options.shardsPerWorker);
        this.connectQueue = new timeout_1.ConnectQueue(5.5e3, this.concurrency);
        if (this.options.debug) {
            this.debugger = new __1.Logger({
                name: '[WorkerManager]',
            });
        }
        if (this.totalShards / this.shardsPerWorker > this.workers) {
            throw new Error(`Cannot create enough shards in the specified workers, minimum: ${Math.ceil(this.totalShards / this.shardsPerWorker)}`);
        }
        const spaces = this.prepareSpaces();
        await this.prepareWorkers(spaces);
    }
}
exports.WorkerManager = WorkerManager;
