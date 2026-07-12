import type { GatewayDispatchPayload } from '../types';
import { properties } from '../websocket/constants';
import type {
	PhysicalGatewayDispatch,
	PhysicalHostToWorkerMessage,
	PhysicalWorkerIdentity,
	PhysicalWorkerToHostMessage,
} from '../websocket/discord/physical-worker-port';
import { ShardSocketCloseCodes } from '../websocket/discord/shared';
import { ConnectQueue } from '../websocket/structures/timeout';
import { Transformers } from './transformers';
import type { WorkerClient } from './workerclient';

type Snapshot = Readonly<Record<string, unknown>>;

interface AppliedTask {
	fingerprint: string;
	task: Promise<void>;
	acknowledged: boolean;
}

const DEFAULT_RECENT_DISPATCHES = 1_024;
const MAX_RECENT_DISPATCHES = 4_096;

/**
 * The worker-side half of the physical port. Its queue only schedules local
 * Discord IDENTIFY buckets; it contains no cross-worker or lifecycle policy.
 * Raw gateway traffic leaves the process, and only traffic returned by the
 * owning port may reach cache, events, collectors, or commands.
 */
export class PhysicalWorkerRuntime {
	private applicationReady = false;
	private shardsReady = false;
	private readySent = false;
	private readyTask?: Promise<void>;
	private userTrafficStarted = false;
	private userShardsConnected = false;
	private userWorkerReady = false;
	private readonly appliedConnectedShards = new Set<number>();
	private readonly appliedReadyShards = new Set<number>();
	private connectQueue?: ConnectQueue;
	private readonly applied = new Map<string, AppliedTask>();
	private readonly hydratedSnapshots = new Map<string, AppliedTask>();
	private readonly recentDispatchLimit: number;

	constructor(
		private readonly client: WorkerClient,
		readonly identity: Readonly<PhysicalWorkerIdentity>,
	) {
		this.recentDispatchLimit = resolveRecentDispatchLimit(process.env.SEYFERT_PHYSICAL_RECENT_DISPATCHES);
	}

	get allowsUserEvents() {
		return this.userTrafficStarted;
	}

	claimShardsConnected(shardId: number) {
		if (!this.isLiveAssignedShard(shardId, 'isOpen')) return false;
		this.appliedConnectedShards.add(shardId);
		if (this.userShardsConnected || !this.hasAppliedEveryShard(this.appliedConnectedShards, 'isOpen')) return false;
		this.userShardsConnected = true;
		return true;
	}

	claimWorkerReady(shardId: number) {
		if (!this.isLiveAssignedShard(shardId, 'isReady')) return false;
		this.appliedReadyShards.add(shardId);
		if (this.userWorkerReady || !this.hasAppliedEveryShard(this.appliedReadyShards, 'isReady')) return false;
		this.userWorkerReady = true;
		return true;
	}

	markShardDisconnected(shardId: number) {
		if (!this.isAssignedShard(shardId)) return;
		this.appliedConnectedShards.delete(shardId);
		this.appliedReadyShards.delete(shardId);
	}

	startGateway() {
		if (this.connectQueue) return;
		const data = this.client.workerData;
		assertPhysicalTopology(data.shards, data.totalShards, data.info.session_start_limit.max_concurrency);
		const concurrency = data.info.session_start_limit.max_concurrency;
		const queue = new ConnectQueue(5.5e3, 1);
		const shards = data.shards.map(id =>
			this.client.createShard(id, {
				compress: data.compress,
				info: { ...data.info, shards: data.totalShards },
				properties,
			}),
		);
		this.connectQueue = queue;
		for (const shard of shards) this.client.shards.set(shard.id, shard);
		for (const round of identifyRounds(shards, concurrency)) {
			queue.push(() => {
				void Promise.all(round.map(shard => shard.connect())).catch(error => this.client.logger.error(error));
			});
		}
	}

	close() {
		this.connectQueue?.clear();
		this.connectQueue = undefined;
		for (const shard of this.client.shards.values()) shard.disconnect(ShardSocketCloseCodes.ShutdownAll);
	}

	async capture(shardId: number, payload: GatewayDispatchPayload) {
		if (this.isAssignedShard(shardId)) {
			if (payload.t === 'READY') {
				this.appliedConnectedShards.delete(shardId);
				this.appliedReadyShards.delete(shardId);
				this.userShardsConnected = false;
				this.userWorkerReady = false;
			} else if (payload.t === 'GUILDS_READY') {
				this.appliedReadyShards.delete(shardId);
				this.userWorkerReady = false;
			}
		}
		const body: PhysicalGatewayDispatch = { shardId, payload };
		await this.post({
			type: 'SEYFERT_PHYSICAL_RAW_DISPATCH',
			...this.identity,
			body,
		});
		if (payload.t === 'GUILDS_READY' && [...this.client.shards.values()].every(shard => shard.isReady)) {
			this.shardsReady = true;
			await this.announceReady();
		}
	}

	async markApplicationReady() {
		this.applicationReady = true;
		await this.announceReady();
	}

	async handleMessage(message: unknown) {
		if (!isObject(message)) return false;
		if (message.type !== 'SEYFERT_PHYSICAL_APPLY_DISPATCH') return false;
		if (!this.sameIdentity(message)) return true;
		await this.handleDispatch(message as PhysicalHostToWorkerMessage);
		return true;
	}

	private async handleDispatch(message: PhysicalHostToWorkerMessage) {
		if (message.type !== 'SEYFERT_PHYSICAL_APPLY_DISPATCH') return;
		const body = message.body;
		const valid = isGatewayDispatch(body);
		let hydrationTask: Promise<void> | undefined;
		let snapshotFingerprint: string | undefined;
		const task = valid
			? this.memoized(this.applied, message.dispatchId, fingerprint({ body, snapshot: message.snapshot }), async () => {
					if (message.snapshot) {
						snapshotFingerprint = fingerprint(message.snapshot);
						hydrationTask = this.hydrate(message.snapshot, snapshotFingerprint);
						await hydrationTask;
					}
					this.userTrafficStarted = true;
					await this.client.dispatchGatewayPacket(body.shardId, body.payload);
					if (body.payload.t === 'RESUMED') this.restoreResumedShard(body.shardId);
				})
			: Promise.reject(new TypeError('Invalid physical gateway dispatch'));
		await this.acknowledge(task, error => ({
			type: 'SEYFERT_PHYSICAL_DISPATCH_ACK',
			...this.identity,
			dispatchId: message.dispatchId,
			...(error ? { error } : {}),
		}));
		this.markAcknowledged(this.applied, message.dispatchId, task);
		if (snapshotFingerprint && hydrationTask) {
			this.markAcknowledged(this.hydratedSnapshots, snapshotFingerprint, hydrationTask);
		}
	}

	private memoized(store: Map<string, AppliedTask>, id: string, inputFingerprint: string, run: () => Promise<void>) {
		if (!id) return Promise.reject(new TypeError('Physical operation id must be non-empty'));
		const previous = store.get(id);
		if (previous) {
			store.delete(id);
			store.set(id, previous);
			if (previous.fingerprint !== inputFingerprint)
				return Promise.reject(new TypeError('Physical operation id was reused with different input'));
			return previous.task;
		}
		this.prune(store);
		if (store.size >= this.recentDispatchLimit) {
			return Promise.reject(new Error('Physical dispatch retry window is full; retry after an ACK'));
		}
		const task = Promise.resolve().then(run);
		store.set(id, { fingerprint: inputFingerprint, task, acknowledged: false });
		return task;
	}

	private prune(store: Map<string, AppliedTask>) {
		while (store.size >= this.recentDispatchLimit) {
			const acknowledged = [...store].find(([, entry]) => entry.acknowledged);
			if (!acknowledged) return;
			store.delete(acknowledged[0]);
		}
	}

	private hydrate(snapshot: Snapshot, snapshotFingerprint: string) {
		return this.memoized(this.hydratedSnapshots, snapshotFingerprint, snapshotFingerprint, async () => {
			const dispatches = snapshot.dispatches;
			if (dispatches !== undefined) {
				if (!Array.isArray(dispatches) || !dispatches.every(isGatewayDispatch))
					throw new TypeError('Physical snapshot dispatches must contain valid gateway dispatches');
				for (const { payload } of dispatches) {
					if (payload.t === 'READY') {
						this.client.botId = payload.d.user.id;
						this.client.applicationId = payload.d.application.id;
						this.client.me = Transformers.ClientUser(this.client, payload.d.user, payload.d.application) as never;
					}
					await this.client.cache.onPacket(payload);
				}
			}
		});
	}

	private markAcknowledged(store: Map<string, AppliedTask>, id: string, task: Promise<void>) {
		const entry = store.get(id);
		if (entry?.task === task) entry.acknowledged = true;
	}

	private async acknowledge(task: Promise<void>, message: (error?: string) => PhysicalWorkerToHostMessage) {
		try {
			await task;
			await this.post(message());
		} catch (error) {
			await this.post(message(toError(error).message));
		}
	}

	private async announceReady() {
		if (this.readySent || !this.applicationReady || !this.shardsReady) return;
		if (!this.readyTask) {
			const task = this.post({
				type: 'SEYFERT_PHYSICAL_READY',
				...this.identity,
			});
			this.readyTask = task;
			void task.then(
				() => {
					this.readySent = true;
				},
				() => {
					if (this.readyTask === task) this.readyTask = undefined;
				},
			);
		}
		await this.readyTask;
	}

	private sameIdentity(message: Record<string, unknown>) {
		return message.slot === this.identity.slot && message.token === this.identity.token;
	}

	private isAssignedShard(shardId: number) {
		return this.client.workerData.shards.includes(shardId);
	}

	private isLiveAssignedShard(shardId: number, state: 'isOpen' | 'isReady') {
		return this.isAssignedShard(shardId) && !!this.client.shards.get(shardId)?.[state];
	}

	private hasAppliedEveryShard(applied: ReadonlySet<number>, state: 'isOpen' | 'isReady') {
		return this.client.workerData.shards.every(
			shardId => applied.has(shardId) && !!this.client.shards.get(shardId)?.[state],
		);
	}

	private restoreResumedShard(shardId: number) {
		if (!this.isLiveAssignedShard(shardId, 'isOpen') || !this.isLiveAssignedShard(shardId, 'isReady')) return;
		this.appliedConnectedShards.add(shardId);
		this.appliedReadyShards.add(shardId);
		this.userShardsConnected = this.hasAppliedEveryShard(this.appliedConnectedShards, 'isOpen');
		this.userWorkerReady = this.hasAppliedEveryShard(this.appliedReadyShards, 'isReady');
	}

	private async post(message: PhysicalWorkerToHostMessage) {
		await this.client.postMessage(message);
	}
}

function isGatewayDispatch(value: unknown): value is PhysicalGatewayDispatch {
	if (!isObject(value) || !Number.isSafeInteger(value.shardId) || !isObject(value.payload)) return false;
	return value.payload.op === 0 && (typeof value.payload.t === 'string' || value.payload.t === null);
}

function isObject(value: unknown): value is Record<string, any> {
	return typeof value === 'object' && value !== null;
}

function fingerprint(value: unknown) {
	return JSON.stringify(value);
}

function toError(error: unknown) {
	return error instanceof Error ? error : new Error(String(error));
}

function resolveRecentDispatchLimit(raw: string | undefined) {
	if (raw === undefined) return DEFAULT_RECENT_DISPATCHES;
	const value = Number(raw);
	if (!Number.isSafeInteger(value) || value < 1) return DEFAULT_RECENT_DISPATCHES;
	return Math.min(MAX_RECENT_DISPATCHES, Math.max(8, value));
}

function assertPhysicalTopology(shards: readonly number[], totalShards: number, concurrency: number) {
	if (!Number.isSafeInteger(totalShards) || totalShards < 1) {
		throw new RangeError('Physical worker totalShards must be a positive integer');
	}
	if (!Number.isSafeInteger(concurrency) || concurrency < 1) {
		throw new RangeError('Physical worker identify concurrency must be a positive integer');
	}
	if (
		shards.length === 0 ||
		new Set(shards).size !== shards.length ||
		shards.some(shardId => !Number.isSafeInteger(shardId) || shardId < 0 || shardId >= totalShards)
	) {
		throw new RangeError('Physical worker shards must be unique integers inside totalShards');
	}
}

function identifyRounds<T extends { id: number }>(shards: readonly T[], concurrency: number) {
	const bucketDepth = new Array<number>(concurrency).fill(0);
	const rounds: T[][] = [];
	for (const shard of [...shards].sort((left, right) => left.id - right.id)) {
		const bucket = shard.id % concurrency;
		const roundIndex = bucketDepth[bucket]++;
		const round = rounds[roundIndex] ?? [];
		round.push(shard);
		rounds[roundIndex] = round;
	}
	return rounds;
}
