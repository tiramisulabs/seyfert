"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Watcher = void 0;
const node_child_process_1 = require("node:child_process");
const api_1 = require("../../api");
const base_1 = require("../../client/base");
const websocket_1 = require("../../websocket");
const logger_1 = require("../it/logger");
const utils_1 = require("../it/utils");
/**
 * Represents a watcher class that extends the ShardManager.
 */
class Watcher extends websocket_1.ShardManager {
    worker;
    logger = new logger_1.Logger({
        name: '[Watcher]',
    });
    rest;
    /**
     * Initializes a new instance of the Watcher class.
     * @param options The options for the watcher.
     */
    constructor(options) {
        super({
            handlePayload() { },
            token: '',
            intents: 0,
            info: {
                url: 'wss://gateway.discord.gg',
                session_start_limit: {
                    max_concurrency: -1,
                    remaining: -1,
                    reset_after: -1,
                    total: -1,
                },
                shards: -1,
            },
            ...options,
        });
    }
    /**
     * Resets the worker instance.
     */
    resetWorker() {
        const worker_threads = (0, utils_1.lazyLoadPackage)('node:worker_threads');
        if (!worker_threads)
            throw new Error('Cannot use worker_threads');
        if (this.worker) {
            this.worker.terminate();
        }
        this.build();
        this.worker = new worker_threads.Worker(this.options.filePath, {
            argv: this.options.argv,
            workerData: {
                __USING_WATCHER__: true,
            },
        });
        this.worker.on('message', (data) => {
            switch (data.type) {
                case 'SEND_TO_SHARD':
                    this.send(data.shardId, data.payload);
                    break;
            }
        });
    }
    /**
     * Spawns shards for the watcher.
     */
    async spawnShards() {
        const RC = await base_1.BaseClient.prototype.getRC();
        this.options.token = RC.token;
        this.rest ??= new api_1.ApiHandler({
            baseUrl: 'api/v10',
            domain: 'https://discord.com',
            token: this.options.token,
        });
        this.options.intents = RC.intents;
        this.options.info = await new api_1.Router(this.rest).createProxy().gateway.bot.get();
        this.options.totalShards = this.options.info.shards;
        this.resetWorker();
        const oldFn = this.options.handlePayload;
        this.options.handlePayload = (shardId, payload) => {
            this.worker?.postMessage({
                type: 'PAYLOAD',
                shardId,
                payload,
            });
            return oldFn?.(shardId, payload);
        };
        this.connectQueue.concurrency = this.options.info.session_start_limit.max_concurrency;
        await super.spawnShards();
        const chokidar = (0, utils_1.lazyLoadPackage)('chokidar');
        if (!chokidar?.watch)
            return this.logger.warn('No chokidar installed.');
        const watcher = chokidar.watch(this.options.srcPath).on('ready', () => {
            this.logger.debug(`Watching ${this.options.srcPath}`);
            watcher.on('all', event => {
                this.logger.debug(`${event} event detected, building`);
                this.resetWorker();
            });
        });
    }
    /**
     * Builds the watcher.
     */
    build() {
        (0, node_child_process_1.execSync)(`cd ${process.cwd()} && ${this.options.transpileCommand}`);
        this.logger.info('Builded');
    }
}
exports.Watcher = Watcher;
