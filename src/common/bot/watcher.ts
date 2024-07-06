import type { GatewayDispatchPayload, GatewaySendPayload } from 'discord-api-types/v10';
import { execSync } from 'node:child_process';
import { ApiHandler, Router } from '../../api';
import { BaseClient, type InternalRuntimeConfig } from '../../client/base';
import { ShardManager, type ShardManagerDefaults, type ShardManagerOptions } from '../../websocket';
import { Logger } from '../it/logger';
import type { MakePartial, MakeRequired } from '../types/util';
import { lazyLoadPackage } from '../it/utils';

/**
 * Represents a watcher class that extends the ShardManager.
 */
export class Watcher extends ShardManager {
	worker?: import('node:worker_threads').Worker;
	logger = new Logger({
		name: '[Watcher]',
	});
	rest?: ApiHandler;

	declare options: MakeRequired<WatcherOptions, 'token' | 'info' | keyof typeof ShardManagerDefaults>;

	/**
	 * Initializes a new instance of the Watcher class.
	 * @param options The options for the watcher.
	 */
	constructor(options: WatcherOptions) {
		super({
			handlePayload() {},
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
		const worker_threads = lazyLoadPackage<typeof import('node:worker_threads')>('node:worker_threads');
		if (!worker_threads) throw new Error('Cannot use worker_threads');
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
		this.worker!.on('message', (data: WatcherSendToShard) => {
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
		const RC = await BaseClient.prototype.getRC<InternalRuntimeConfig>();
		this.options.token = RC.token;
		this.rest ??= new ApiHandler({
			baseUrl: 'api/v10',
			domain: 'https://discord.com',
			token: this.options.token,
		});
		this.options.intents = RC.intents;
		this.options.info = await new Router(this.rest!).createProxy().gateway.bot.get();
		this.options.totalShards = this.options.info.shards;

		this.resetWorker();

		const oldFn = this.options.handlePayload;
		this.options.handlePayload = (shardId, payload) => {
			this.worker?.postMessage({
				type: 'PAYLOAD',
				shardId,
				payload,
			} satisfies WatcherPayload);
			return oldFn?.(shardId, payload);
		};
		this.connectQueue.concurrency = this.options.info.session_start_limit.max_concurrency;

		await super.spawnShards();

		const chokidar = lazyLoadPackage<typeof import('chokidar')>('chokidar');

		if (!chokidar?.watch) return this.logger.warn('No chokidar installed.');

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
	protected build() {
		execSync(`cd ${process.cwd()} && ${this.options.transpileCommand}`);
		this.logger.info('Builded');
	}
}

export interface WatcherOptions
	extends MakePartial<
		Omit<ShardManager['options'], 'handlePayload' | 'info' | 'token' | 'intents'>,
		| 'compress'
		| 'presence'
		| 'properties'
		| 'shardEnd'
		| 'shardStart'
		| 'spawnShardDelay'
		| 'totalShards'
		| 'url'
		| 'version'
	> {
	filePath: string;
	transpileCommand: string;
	srcPath: string;
	argv?: string[];
	handlePayload?: ShardManagerOptions['handlePayload'];
	info?: ShardManagerOptions['info'];
	token?: ShardManagerOptions['token'];
	intents?: ShardManagerOptions['intents'];
}

export interface WatcherPayload {
	type: 'PAYLOAD';
	shardId: number;
	payload: GatewayDispatchPayload;
}

export interface WatcherSendToShard {
	type: 'SEND_TO_SHARD';
	shardId: number;
	payload: GatewaySendPayload;
}
