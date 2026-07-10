import { SeyfertError } from '../common';
import type { GatewayDispatchPayload } from '../types';
import { ShardSocketCloseCodes, type WorkerData } from '../websocket';
import type { WorkerHeartbeaterMessages } from '../websocket/discord/heartbeater';
import type {
	WorkerGenerationAborted,
	WorkerGenerationActivated,
	WorkerGenerationCutoverReady,
	WorkerGenerationDrained,
	WorkerGenerationFailed,
	WorkerGenerationShardsReady,
} from '../websocket/discord/worker';
import type { ManagerMessages } from '../websocket/discord/workermanager';
import { applyPluginGatewayDispatchInterceptors } from './plugins';
import { Transformers } from './transformers';
import type { WorkerClient } from './workerclient';

const CUTOVER_BUFFER_LIMIT = 10_000;

type BufferedDispatch = { shardId: number; packet: GatewayDispatchPayload };

/** Owns the lifecycle of one worker generation independently from the worker client's normal message handling. */
export class WorkerGenerationRuntime {
	private active = true;
	private shardsReady = false;
	private dispatches = 0;
	private drainWaiters: (() => void)[] = [];
	private shadowHydrations = 0;
	private shadowWaiters: (() => void)[] = [];
	private shadowError?: unknown;
	private cutoverBuffering = false;
	private cutoverBuffer: BufferedDispatch[] = [];
	private cutoverBufferHead = 0;
	private bootstrapPackets: BufferedDispatch[] = [];
	private readyEventsRun = false;
	private aborted = false;
	private failure?: Error;
	private activationInFlight?: Promise<void>;
	private activationAcknowledged = false;
	private supervisorFenceInstalled = false;
	private supervisorFailedClosed = false;
	private supervisorLeaseTimer?: NodeJS.Timeout;
	private supervisorLeaseDeadline?: number;
	private supervisorLeaseSequence = 0;
	private supervisorExitProcess: (code: number) => void = code => process.exit(code);
	private supervisorMonotonicNow = () => Number(process.hrtime.bigint() / 1_000_000n);

	constructor(
		private readonly client: WorkerClient,
		private readonly getWorkerData: () => WorkerData,
	) {
		this.active = !getWorkerData()?.shadow;
	}

	get isActive() {
		return this.active;
	}

	reset(data: WorkerData) {
		clearTimeout(this.supervisorLeaseTimer);
		this.active = !data.shadow;
		this.shardsReady = false;
		this.dispatches = 0;
		this.drainWaiters = [];
		this.shadowHydrations = 0;
		this.shadowWaiters = [];
		this.shadowError = undefined;
		this.cutoverBuffering = false;
		this.cutoverBuffer = [];
		this.cutoverBufferHead = 0;
		this.bootstrapPackets = [];
		this.readyEventsRun = false;
		this.aborted = false;
		this.failure = undefined;
		this.activationInFlight = undefined;
		this.activationAcknowledged = false;
		this.supervisorFailedClosed = false;
		this.supervisorLeaseTimer = undefined;
		this.supervisorLeaseDeadline = undefined;
		this.supervisorLeaseSequence = 0;
	}

	acceptsMessage(data: ManagerMessages | WorkerHeartbeaterMessages) {
		const worker = this.getWorkerData();
		if (
			worker.generation !== undefined &&
			worker.allocationId &&
			(data.generation === undefined || data.allocationId === undefined)
		)
			return false;
		if (data.generation !== undefined && data.generation !== worker.generation) return false;
		if (data.allocationId !== undefined && data.allocationId !== worker.allocationId) return false;
		return true;
	}

	handleSupervisorMessage(data: ManagerMessages | WorkerHeartbeaterMessages) {
		const worker = this.getWorkerData();
		if (data.type !== 'RENEW_WORKER_SUPERVISOR_LEASE') return false;
		if (worker.supervisorTimeoutMs !== undefined)
			this.renewSupervisorLease(data.expiresInMs, data.issuedAtMonotonicMs, data.sequence);
		return true;
	}

	async handleControlMessage(data: ManagerMessages | WorkerHeartbeaterMessages) {
		const worker = this.getWorkerData();
		switch (data.type) {
			case 'BEGIN_WORKER_GENERATION_CUTOVER':
				if (!worker.shadow || this.aborted || this.failure) return true;
				this.cutoverBuffering = true;
				this.client.postMessage({
					type: 'WORKER_GENERATION_CUTOVER_READY',
					workerId: worker.workerId,
				} satisfies WorkerGenerationCutoverReady);
				return true;
			case 'ACTIVATE_WORKER_GENERATION':
				await this.activate();
				return true;
			case 'DRAIN_WORKER_GENERATION':
				this.active = false;
				await this.waitForDispatches();
				for (const shard of this.client.shards.values()) shard.disconnect(ShardSocketCloseCodes.Resharding);
				this.client.postMessage({
					type: 'WORKER_GENERATION_DRAINED',
					workerId: worker.workerId,
				} satisfies WorkerGenerationDrained);
				return true;
			case 'ABORT_WORKER_GENERATION':
				this.abort();
				this.client.postMessage({
					type: 'WORKER_GENERATION_ABORTED',
					workerId: worker.workerId,
				} satisfies WorkerGenerationAborted);
				return true;
			default:
				return false;
		}
	}

	async handleShadowPacket(shardId: number, packet: GatewayDispatchPayload) {
		const worker = this.getWorkerData();
		if (!worker.shadow || this.aborted || this.failure) return;
		if (this.cutoverBuffering) {
			if (this.cutoverBuffer.length - this.cutoverBufferHead >= CUTOVER_BUFFER_LIMIT) {
				this.fail(
					new Error(`Worker generation cutover buffer exceeded ${CUTOVER_BUFFER_LIMIT} events`),
					'Worker generation cutover buffer limit exceeded',
				);
				return;
			}
			this.cutoverBuffer.push({ shardId, packet });
			return;
		}

		this.shadowHydrations++;
		let shadowPacket = packet;
		try {
			const pluginPacket = await applyPluginGatewayDispatchInterceptors(this.client, shardId, packet);
			if (pluginPacket === null) return;
			shadowPacket = pluginPacket;
			if (shadowPacket.t === 'READY' || shadowPacket.t === 'GUILDS_READY')
				this.rememberBootstrapPacket(shardId, shadowPacket);
			if (shadowPacket.t === 'READY') {
				this.client.botId = shadowPacket.d.user.id;
				this.client.applicationId = shadowPacket.d.application.id;
				this.client.me = Transformers.ClientUser(this.client, shadowPacket.d.user, shadowPacket.d.application) as never;
				this.client.debugger?.debug(
					`#${shardId}[${shadowPacket.d.user.username}](${this.client.botId}) shadow is online...`,
				);
			}
			await this.client.cache.onPacket(shadowPacket);
		} catch (error) {
			this.shadowError ??= error;
			this.fail(error, 'Worker generation shadow cache hydration failed');
		} finally {
			this.shadowHydrations--;
			if (this.shadowHydrations === 0) {
				const waiters = this.shadowWaiters.splice(0);
				for (const resolve of waiters) resolve();
			}
		}

		if (shadowPacket.t !== 'GUILDS_READY') return;
		await this.waitForShadowHydrations();
		if (this.shadowError) {
			this.fail(this.shadowError, 'Cannot ready a worker generation after shadow cache hydration failed');
			return;
		}
		if (!this.shardsReady && [...this.client.shards.values()].every(shard => shard.isReady)) {
			this.shardsReady = true;
			this.client.postMessage({
				type: 'WORKER_GENERATION_SHARDS_READY',
				workerId: worker.workerId,
			} satisfies WorkerGenerationShardsReady);
		}
	}

	installSupervisorFence(
		supervisor: Pick<NodeJS.Process, 'connected' | 'once' | 'send'> = process,
		exitProcess: (code: number) => void = code => process.exit(code),
	) {
		const worker = this.getWorkerData();
		this.supervisorExitProcess = exitProcess;
		if (worker.supervisorTimeoutMs !== undefined && !this.supervisorFenceInstalled) {
			if (typeof supervisor.send !== 'function' || supervisor.connected === false) {
				this.failClosedWithoutSupervisor(exitProcess);
				return false;
			}
			this.supervisorFenceInstalled = true;
			supervisor.once('disconnect', () => this.failClosedWithoutSupervisor(exitProcess));
		}
		if (worker.supervisorTimeoutMs !== undefined && this.supervisorLeaseDeadline === undefined)
			this.renewSupervisorLease(worker.supervisorTimeoutMs, worker.supervisorIssuedAtMonotonicMs!);
		return !this.supervisorFailedClosed;
	}

	async runDispatch<T>(dispatch: () => Promise<T>): Promise<T | undefined> {
		if (!this.active) return;
		return this.runOperation(dispatch);
	}

	async runOperation<T>(operation: () => Promise<T>): Promise<T> {
		this.dispatches++;
		try {
			return await operation();
		} finally {
			this.completeDispatch();
		}
	}

	track(dispatch: Promise<unknown>) {
		this.dispatches++;
		void dispatch.finally(() => this.completeDispatch());
	}

	private async activate() {
		const worker = this.getWorkerData();
		if (this.aborted || this.failure) return;
		if (this.activationAcknowledged) {
			await this.client.postMessage({
				type: 'WORKER_GENERATION_ACTIVATED',
				workerId: worker.workerId,
			} satisfies WorkerGenerationActivated);
			return;
		}
		if (worker.shadow && !this.shardsReady) {
			this.client.logger.fatal('Cannot activate a worker generation before all shards are ready');
			return;
		}
		if (worker.shadow) {
			if (!this.cutoverBuffering) {
				this.client.logger.fatal('Cannot activate a worker generation before its cutover buffer is armed');
				return;
			}
			try {
				this.activationInFlight ??= this.activateShadowGeneration();
				await this.activationInFlight;
			} catch (error) {
				this.fail(error, 'Worker generation activation failed');
				return;
			}
		}
		if (this.aborted || this.activationAcknowledged) return;
		this.activationAcknowledged = true;
		try {
			await this.client.postMessage({
				type: 'WORKER_GENERATION_ACTIVATED',
				workerId: worker.workerId,
			} satisfies WorkerGenerationActivated);
		} catch (error) {
			this.activationAcknowledged = false;
			throw error;
		}
	}

	private abort() {
		this.aborted = true;
		this.active = false;
		this.cutoverBuffering = false;
		this.cutoverBuffer = [];
		this.cutoverBufferHead = 0;
		this.bootstrapPackets = [];
		for (const shard of this.client.shards.values()) shard.disconnect(ShardSocketCloseCodes.Resharding);
		for (const shard of this.client.resharding.values()) shard.disconnect(ShardSocketCloseCodes.Resharding);
		this.client.shards.clear();
		this.client.resharding.clear();
	}

	private waitForShadowHydrations() {
		if (this.shadowHydrations === 0) return Promise.resolve();
		return new Promise<void>(resolve => this.shadowWaiters.push(resolve));
	}

	private renewSupervisorLease(
		expiresInMs: number,
		issuedAtMonotonicMs = this.supervisorMonotonicNow(),
		sequence?: number,
	) {
		this.assertSupervisorLeaseTimeout(expiresInMs);
		if (!Number.isSafeInteger(issuedAtMonotonicMs) || issuedAtMonotonicMs < 0)
			throw new SeyfertError('INTERNAL_ERROR', {
				metadata: { detail: `Supervisor lease issuedAtMonotonicMs must be a non-negative safe integer` },
			});
		if (sequence !== undefined && (!Number.isSafeInteger(sequence) || sequence <= 0))
			throw new SeyfertError('INTERNAL_ERROR', {
				metadata: { detail: `Supervisor lease sequence must be a positive safe integer` },
			});
		if (this.supervisorFailedClosed || this.aborted || this.failure) return;
		const now = this.supervisorMonotonicNow();
		if (this.supervisorLeaseDeadline !== undefined && now >= this.supervisorLeaseDeadline) {
			this.failClosedWithoutSupervisor(this.supervisorExitProcess);
			return;
		}
		if (sequence !== undefined) {
			if (sequence <= this.supervisorLeaseSequence) return;
			this.supervisorLeaseSequence = sequence;
		}
		const deadline = issuedAtMonotonicMs + expiresInMs;
		if (!Number.isSafeInteger(deadline))
			throw new SeyfertError('INTERNAL_ERROR', {
				metadata: { detail: `Supervisor lease deadline exceeds the safe integer range` },
			});
		if (deadline <= now) {
			if (this.supervisorLeaseDeadline === undefined) this.failClosedWithoutSupervisor(this.supervisorExitProcess);
			return;
		}
		if (this.supervisorLeaseDeadline !== undefined && deadline <= this.supervisorLeaseDeadline) return;
		clearTimeout(this.supervisorLeaseTimer);
		this.supervisorLeaseDeadline = deadline;
		this.scheduleSupervisorLeaseExpiry(deadline);
	}

	private assertSupervisorLeaseTimeout(expiresInMs: number) {
		if (!Number.isSafeInteger(expiresInMs) || expiresInMs <= 0 || expiresInMs > 2_147_483_647)
			throw new SeyfertError('INTERNAL_ERROR', {
				metadata: {
					detail: `Supervisor lease TTL must be a positive safe integer no greater than 2147483647 milliseconds`,
				},
			});
	}

	private scheduleSupervisorLeaseExpiry(deadline: number) {
		const check = () => {
			if (this.supervisorLeaseDeadline !== deadline) return;
			const remaining = deadline - this.supervisorMonotonicNow();
			if (remaining > 0) {
				this.supervisorLeaseTimer = setTimeout(check, Math.ceil(remaining));
				return;
			}
			this.failClosedWithoutSupervisor(this.supervisorExitProcess);
		};
		this.supervisorLeaseTimer = setTimeout(check, Math.max(1, Math.ceil(deadline - this.supervisorMonotonicNow())));
	}

	private failClosedWithoutSupervisor(exitProcess: (code: number) => void = code => process.exit(code)) {
		if (this.supervisorFailedClosed) return;
		this.supervisorFailedClosed = true;
		clearTimeout(this.supervisorLeaseTimer);
		this.supervisorLeaseTimer = undefined;
		this.supervisorLeaseDeadline = undefined;
		this.failure ??= new SeyfertError('INTERNAL_ERROR', {
			metadata: { detail: 'Worker supervisor IPC channel disconnected' },
		});
		this.aborted = true;
		this.active = false;
		this.cutoverBuffering = false;
		this.cutoverBuffer = [];
		this.cutoverBufferHead = 0;
		this.bootstrapPackets = [];
		for (const shard of this.client.shards.values()) shard.disconnect(ShardSocketCloseCodes.ShutdownAll);
		for (const shard of this.client.resharding.values()) shard.disconnect(ShardSocketCloseCodes.ShutdownAll);
		this.client.shards.clear();
		this.client.resharding.clear();
		exitProcess(1);
	}

	private async activateShadowGeneration() {
		await this.waitForShadowHydrations();
		if (this.shadowError) throw this.shadowError;
		await this.replayBootstrapPackets();
		if (!this.readyEventsRun) {
			await this.client.events.runEvent('WORKER_SHARDS_CONNECTED', this.client, this.client.me, -1);
			await this.client.events.runEvent('WORKER_READY', this.client, this.client.me, -1);
			this.readyEventsRun = true;
		}

		while (!this.aborted) {
			const buffered = this.cutoverBuffer[this.cutoverBufferHead];
			if (buffered) {
				await this.client.dispatchGatewayPacket(buffered.shardId, buffered.packet);
				this.cutoverBufferHead++;
				if (this.cutoverBufferHead >= 1_024 && this.cutoverBufferHead * 2 >= this.cutoverBuffer.length) {
					this.cutoverBuffer.splice(0, this.cutoverBufferHead);
					this.cutoverBufferHead = 0;
				}
				continue;
			}
			await this.waitForDispatches();
			if (this.cutoverBuffer.length === this.cutoverBufferHead) {
				this.cutoverBuffer = [];
				this.cutoverBufferHead = 0;
				this.active = true;
				this.getWorkerData().shadow = false;
				this.cutoverBuffering = false;
				return;
			}
		}
	}

	private rememberBootstrapPacket(shardId: number, packet: GatewayDispatchPayload) {
		const index = this.bootstrapPackets.findIndex(entry => entry.shardId === shardId && entry.packet.t === packet.t);
		const entry = { shardId, packet };
		if (index === -1) this.bootstrapPackets.push(entry);
		else this.bootstrapPackets[index] = entry;
	}

	private async replayBootstrapPackets() {
		const packets = this.bootstrapPackets;
		this.bootstrapPackets = [];
		for (const { shardId, packet } of packets) {
			this.track(
				Promise.allSettled([
					this.client.events.runEvent('RAW', this.client, packet, shardId, false),
					this.client.collectors.run('RAW', packet, this.client),
				]),
			);
			await this.client.events.execute(packet, this.client, shardId, false);
		}
	}

	private fail(error: unknown, message: string) {
		if (this.failure) return;
		this.failure = error instanceof Error ? error : new Error(String(error));
		this.aborted = true;
		this.active = false;
		this.cutoverBuffering = false;
		this.cutoverBuffer = [];
		this.cutoverBufferHead = 0;
		this.bootstrapPackets = [];
		this.client.logger.fatal(message, this.failure);
		try {
			void Promise.resolve(
				this.client.postMessage({
					type: 'WORKER_GENERATION_FAILED',
					workerId: this.getWorkerData().workerId,
					message: this.failure.message,
				} satisfies WorkerGenerationFailed),
			).catch(postError => this.client.logger.error('Cannot report worker generation failure', postError));
		} catch (postError) {
			this.client.logger.error('Cannot report worker generation failure', postError);
		}
	}

	private completeDispatch() {
		this.dispatches--;
		if (this.dispatches === 0) {
			const waiters = this.drainWaiters.splice(0);
			for (const resolve of waiters) resolve();
		}
	}

	private waitForDispatches() {
		if (this.dispatches === 0) return Promise.resolve();
		return new Promise<void>(resolve => this.drainWaiters.push(resolve));
	}
}
