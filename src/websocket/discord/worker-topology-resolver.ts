import { ApiHandler, Logger } from '../..';
import { BaseClient, type InternalRuntimeConfig } from '../../client/base';
import { BASE_HOST, MergeOptions, SeyfertError } from '../../common';
import { WorkerManagerDefaults } from '../constants';
import { ConnectQueue } from '../structures/timeout';
import type { ResolvedWorkerShardTopology } from './shared';
import type { WorkerManager } from './workermanager';

/** Resolves and memoizes the effective topology before any worker is created. */
export class WorkerTopologyResolver {
	private resolution?: Promise<ResolvedWorkerShardTopology>;

	constructor(private readonly manager: WorkerManager) {}

	resolve() {
		if (this.resolution) return this.resolution;
		const resolution = Promise.resolve().then(() => this.resolveRuntime());
		this.resolution = resolution;
		void resolution.catch(() => {
			if (this.resolution === resolution) this.resolution = undefined;
		});
		return resolution;
	}

	private async resolveRuntime(): Promise<ResolvedWorkerShardTopology> {
		const manager = this.manager;
		const rc =
			((await manager.options.getRC?.()) as InternalRuntimeConfig | undefined) ??
			(await BaseClient.prototype.getRC<InternalRuntimeConfig>());

		manager.options.debug ||= rc.debug ?? false;
		manager.options.intents ??= rc.intents ?? 0;
		manager.options.token ??= rc.token;
		manager.rest ??= new ApiHandler({
			token: manager.options.token,
			baseUrl: 'api/v10',
			domain: BASE_HOST,
			debug: manager.options.debug,
		});
		const gatewayInfo = manager.options.info ?? (await manager.rest.proxy.gateway.bot.get());
		if (!Number.isSafeInteger(gatewayInfo.shards) || gatewayInfo.shards <= 0)
			throw new SeyfertError('INTERNAL_ERROR', {
				metadata: { detail: 'info.shards must be a positive safe integer' },
			});
		manager.options.info ??= gatewayInfo;
		manager.options.shardEnd ??= manager.options.totalShards ?? manager.options.info.shards;
		manager.options.totalShards ??= manager.options.shardEnd;
		manager.options = MergeOptions(WorkerManagerDefaults, manager.options) as WorkerManager['options'];

		for (const [name, value] of [
			['totalShards', manager.options.totalShards],
			['shardEnd', manager.options.shardEnd],
			['shardsPerWorker', manager.options.shardsPerWorker],
		] as const) {
			if (!Number.isSafeInteger(value) || value <= 0)
				throw new SeyfertError('INTERNAL_ERROR', {
					metadata: { detail: `${name} must be a positive safe integer` },
				});
		}
		if (!Number.isSafeInteger(manager.options.shardStart) || manager.options.shardStart < 0)
			throw new SeyfertError('INTERNAL_ERROR', {
				metadata: { detail: 'shardStart must be a non-negative safe integer' },
			});
		if (
			manager.options.shardEnd <= manager.options.shardStart ||
			manager.options.shardEnd > manager.options.totalShards
		)
			throw new SeyfertError('INTERNAL_ERROR', {
				metadata: { detail: 'shardEnd must be greater than shardStart and no greater than totalShards' },
			});

		manager.options.resharding.getInfo ??= () => manager.rest.proxy.gateway.bot.get();
		const expectedWorkers = Math.ceil(
			(manager.options.shardEnd - manager.options.shardStart) / manager.options.shardsPerWorker,
		);
		manager.options.workers ??= expectedWorkers;
		if (!Number.isSafeInteger(manager.options.workers) || manager.options.workers <= 0)
			throw new SeyfertError('INTERNAL_ERROR', {
				metadata: { detail: 'workers must be a positive safe integer' },
			});
		if (manager.options.workers !== expectedWorkers)
			throw new SeyfertError('INTERNAL_ERROR', {
				metadata: {
					detail: `workers must be ${expectedWorkers} for shard range ${manager.options.shardStart}-${manager.options.shardEnd} with ${manager.options.shardsPerWorker} shards per worker`,
				},
			});

		manager.connectQueue = new ConnectQueue(5.5e3, manager.concurrency);
		if (manager.options.debug) manager.debugger = new Logger({ name: '[WorkerManager]' });
		const info = Object.freeze({
			...manager.options.info,
			session_start_limit: Object.freeze({ ...manager.options.info.session_start_limit }),
		});
		return Object.freeze({
			info,
			totalShards: manager.totalShards,
			shardStart: manager.shardStart,
			shardEnd: manager.shardEnd,
			shardsPerWorker: manager.shardsPerWorker,
			workers: manager.totalWorkers,
		});
	}
}
