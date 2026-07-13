import type { Awaitable } from '../../common';
import type { GatewayDispatchPayload } from '../../types';

export interface PhysicalWorkerIdentity {
	/** Stable local slot. It has no placement or lifecycle meaning. */
	slot: string;
	/** Opaque identity chosen by the caller. Seyfert never parses or orders it. */
	token: string;
}

export interface PhysicalShardTopology {
	shardStart: number;
	/** Exclusive upper bound. */
	shardEnd: number;
	totalShards: number;
}

export interface PhysicalGatewayDispatch {
	shardId: number;
	payload: GatewayDispatchPayload;
}

interface PhysicalWorkerIpcIdentity {
	slot: string;
	token: string;
}

export type PhysicalWorkerToHostMessage<Dispatch = PhysicalGatewayDispatch> =
	| (PhysicalWorkerIpcIdentity & { type: 'SEYFERT_PHYSICAL_READY' })
	| (PhysicalWorkerIpcIdentity & { type: 'SEYFERT_PHYSICAL_RAW_DISPATCH'; body: Dispatch })
	| (PhysicalWorkerIpcIdentity & {
			type: 'SEYFERT_PHYSICAL_DISPATCH_ACK';
			dispatchId: string;
			error?: string;
	  });

export type PhysicalHostToWorkerMessage<Dispatch = PhysicalGatewayDispatch> = PhysicalWorkerIpcIdentity & {
	type: 'SEYFERT_PHYSICAL_APPLY_DISPATCH';
	dispatchId: string;
	body: Dispatch;
	snapshot?: Readonly<Record<string, unknown>>;
};

export type PhysicalWorkerIpcMessage<Dispatch = PhysicalGatewayDispatch> =
	| PhysicalWorkerToHostMessage<Dispatch>
	| PhysicalHostToWorkerMessage<Dispatch>;

interface PhysicalWorkerCommandBase {
	commandId: string;
	identity: PhysicalWorkerIdentity;
}

export type PhysicalWorkerCommand =
	| (PhysicalWorkerCommandBase & {
			kind: 'launch';
			topology: PhysicalShardTopology;
			maxBufferedDispatches: number;
	  })
	| (PhysicalWorkerCommandBase & { kind: 'hydrate'; snapshot: Readonly<Record<string, unknown>> })
	| (PhysicalWorkerCommandBase & { kind: 'arm' })
	| (PhysicalWorkerCommandBase & { kind: 'drain' })
	| (PhysicalWorkerCommandBase & { kind: 'activate' })
	| (PhysicalWorkerCommandBase & { kind: 'close' });

export type PhysicalWorkerRejection = 'stale-token' | 'invalid-command' | 'invalid-state' | 'buffer-overflow';

export type PhysicalWorkerReceipt =
	| (PhysicalWorkerCommandBase & {
			kind: 'accepted';
			operation: PhysicalWorkerCommand['kind'];
			state: 'standby' | 'armed' | 'active' | 'drained' | 'closed';
			replayed?: number;
	  })
	| (PhysicalWorkerCommandBase & {
			kind: 'rejected';
			operation: PhysicalWorkerCommand['kind'];
			reason: PhysicalWorkerRejection;
			detail: string;
	  });

export type PhysicalWorkerSignal =
	| { kind: 'ready'; commandId: string; identity: PhysicalWorkerIdentity }
	| { kind: 'fault'; commandId: string; identity: PhysicalWorkerIdentity; error: Error }
	| { kind: 'overflow'; commandId: string; identity: PhysicalWorkerIdentity; buffered: number };

export interface PhysicalWorkerConnection {
	/** Resolves only after the local application and every shard are ready. */
	ready: Awaitable<void>;
	close(): Awaitable<void>;
}

export interface PhysicalWorkerPortAdapter<Dispatch = unknown> {
	launch(input: {
		identity: Readonly<PhysicalWorkerIdentity>;
		topology: Readonly<PhysicalShardTopology>;
		dispatch: (value: Dispatch) => void;
	}): Awaitable<PhysicalWorkerConnection>;
	dispatch(value: Dispatch, snapshot: Readonly<Record<string, unknown>> | undefined): Awaitable<void>;
}

export interface PhysicalWorkerPortOptions<Dispatch = unknown> {
	adapter: PhysicalWorkerPortAdapter<Dispatch>;
	onSignal?: (signal: PhysicalWorkerSignal) => void;
}

type LocalState =
	| 'launching'
	| 'standby'
	| 'armed'
	| 'replaying'
	| 'active'
	| 'draining'
	| 'drained'
	| 'closing'
	| 'closed'
	| 'failed';

interface PhysicalWorkerRecord<Dispatch> {
	identity: PhysicalWorkerIdentity;
	state: LocalState;
	maxBufferedDispatches: number;
	buffer: Dispatch[];
	inFlight: Set<Promise<void>>;
	deliveryTail?: Promise<void>;
	overflowed: boolean;
	dispatchCommandId: string;
	snapshot?: Readonly<Record<string, unknown>>;
	connection?: PhysicalWorkerConnection;
	connectionPromise?: Promise<PhysicalWorkerConnection>;
	closePromise?: Promise<void>;
	closedSignal: Promise<void>;
	resolveClosed: () => void;
}

interface RecentOperation {
	operation: PhysicalWorkerCommand['kind'];
	fingerprint: string;
	task: Promise<PhysicalWorkerReceipt>;
	settled: boolean;
}

/** Exact retries are supported inside this bounded process-local window. */
const RECENT_OPERATION_LIMIT = 256;
const CLOSED_IDENTITY_LIMIT = 256;

/**
 * A local execution port. It deliberately has one public operation and no
 * knowledge of placement, sequencing across processes, or global lifecycle.
 */
export class PhysicalWorkerPort<Dispatch = unknown> {
	private readonly slots = new Map<string, PhysicalWorkerRecord<Dispatch>>();
	private readonly recent = new Map<string, RecentOperation>();
	private readonly closedIdentities = new Map<string, true>();

	constructor(private readonly options: PhysicalWorkerPortOptions<Dispatch>) {}

	async control(input: PhysicalWorkerCommand): Promise<PhysicalWorkerReceipt> {
		const prepared = prepareCommand(input);
		if ('detail' in prepared) return this.reject(invalidCommandEnvelope(input), 'invalid-command', prepared.detail);
		const { command, fingerprint: inputFingerprint } = prepared;
		const replay = this.replay(command, inputFingerprint);
		if (replay) return replay;
		if (command.kind === 'launch') {
			return this.track(command, inputFingerprint, () => this.launch(command));
		}

		const record = this.slots.get(command.identity.slot);
		if (!record || record.identity.token !== command.identity.token) {
			return this.reject(command, 'stale-token', 'The opaque physical identity is not current for this slot');
		}
		return this.track(command, inputFingerprint, () => this.execute(record, command));
	}

	private async execute(
		record: PhysicalWorkerRecord<Dispatch>,
		command: Exclude<PhysicalWorkerCommand, { kind: 'launch' }>,
	) {
		let receipt: PhysicalWorkerReceipt;
		switch (command.kind) {
			case 'hydrate': {
				if (record.state !== 'standby' && record.state !== 'armed') return this.invalidState(record, command);
				record.snapshot = command.snapshot;
				receipt = this.accept(command, record.state);
				break;
			}
			case 'arm':
				if (record.state === 'standby') record.state = 'armed';
				else if (record.state !== 'armed') return this.invalidState(record, command);
				receipt = this.accept(command, 'armed');
				break;
			case 'drain':
				if (record.state === 'drained') receipt = this.accept(command, 'drained');
				else {
					if (record.state !== 'active') return this.invalidState(record, command);
					record.state = 'draining';
					await Promise.all(record.inFlight);
					if (!this.isCurrent(record, 'draining')) return this.invalidState(record, command);
					record.state = 'drained';
					receipt = this.accept(command, 'drained');
				}
				break;
			case 'activate': {
				if (record.state === 'active') receipt = this.accept(command, 'active', 0);
				else {
					if (record.state !== 'armed') return this.invalidState(record, command);
					record.dispatchCommandId = command.commandId;
					record.state = 'replaying';
					let replayed = 0;
					while (record.buffer.length) {
						await this.deliver(record, record.buffer.shift()!);
						if (!this.isCurrent(record, 'replaying')) return this.invalidState(record, command);
						replayed++;
					}
					if (!this.isCurrent(record, 'replaying')) return this.invalidState(record, command);
					record.state = 'active';
					receipt = this.accept(command, 'active', replayed);
				}
				if (record.state === 'active') record.dispatchCommandId = command.commandId;
				break;
			}
			case 'close':
				try {
					await this.close(record);
				} catch (error) {
					this.options.onSignal?.({
						kind: 'fault',
						commandId: command.commandId,
						identity: record.identity,
						error: toError(error),
					});
					throw error;
				}
				receipt = this.accept(command, 'closed');
				this.retireIdentity(record.identity);
				break;
		}
		return receipt;
	}

	private launch(command: Extract<PhysicalWorkerCommand, { kind: 'launch' }>) {
		const current = this.slots.get(command.identity.slot);
		if (current?.identity.token === command.identity.token) return Promise.resolve(this.invalidState(current, command));
		if (this.closedIdentities.has(identityKey(command.identity))) {
			return Promise.resolve(this.reject(command, 'stale-token', 'The opaque physical identity was already closed'));
		}
		if (current) {
			return Promise.resolve(
				this.reject(command, 'stale-token', 'The slot is occupied by another opaque physical identity'),
			);
		}
		let resolveClosed!: () => void;
		const closedSignal = new Promise<void>(resolve => (resolveClosed = resolve));
		const record: PhysicalWorkerRecord<Dispatch> = {
			identity: Object.freeze({ ...command.identity }),
			state: 'launching',
			maxBufferedDispatches: command.maxBufferedDispatches,
			buffer: [],
			inFlight: new Set(),
			overflowed: false,
			dispatchCommandId: command.commandId,
			closedSignal,
			resolveClosed,
		};
		this.slots.set(command.identity.slot, record);
		return Promise.resolve().then(() => this.open(record, command));
	}

	private async open(
		record: PhysicalWorkerRecord<Dispatch>,
		command: Extract<PhysicalWorkerCommand, { kind: 'launch' }>,
	) {
		try {
			const connectionPromise = Promise.resolve().then(() =>
				this.options.adapter.launch({
					identity: record.identity,
					topology: command.topology,
					dispatch: value => this.receive(record, value),
				}),
			);
			record.connectionPromise = connectionPromise;
			const connection = await connectionPromise;
			record.connection = connection;
			if (isClosed(record)) {
				await this.close(record);
				return this.reject(
					command,
					record.overflowed ? 'buffer-overflow' : 'invalid-state',
					record.overflowed ? 'Dispatch buffer overflowed during launch' : 'Physical instance closed during launch',
				);
			}
			const readiness = Promise.resolve().then(() => connection.ready);
			await Promise.race([readiness, record.closedSignal]);
			if (isClosed(record)) {
				await this.close(record);
				return this.reject(command, 'invalid-state', 'Physical instance closed before readiness');
			}
			record.state = 'standby';
			this.options.onSignal?.({ kind: 'ready', commandId: command.commandId, identity: record.identity });
			return this.accept(command, 'standby');
		} catch (error) {
			record.state = 'closed';
			let failure: Error = toError(error);
			this.options.onSignal?.({
				kind: 'fault',
				commandId: command.commandId,
				identity: record.identity,
				error: failure,
			});
			try {
				await this.close(record);
			} catch (closeError) {
				failure = new AggregateError([failure, closeError], 'Physical launch and close both failed');
				this.options.onSignal?.({
					kind: 'fault',
					commandId: command.commandId,
					identity: record.identity,
					error: failure,
				});
			}
			throw failure;
		}
	}

	private receive(record: PhysicalWorkerRecord<Dispatch>, value: Dispatch) {
		if (record.state === 'active') {
			void this.deliver(record, value);
			return;
		}
		if (!['launching', 'standby', 'armed', 'replaying'].includes(record.state)) return;
		if (record.buffer.length >= record.maxBufferedDispatches) {
			record.overflowed = true;
			const commandId = record.dispatchCommandId;
			this.options.onSignal?.({
				kind: 'overflow',
				commandId,
				identity: record.identity,
				buffered: record.buffer.length,
			});
			void this.close(record).catch(error => {
				this.options.onSignal?.({
					kind: 'fault',
					commandId,
					identity: record.identity,
					error: toError(error),
				});
			});
			return;
		}
		record.buffer.push(value);
	}

	private deliver(record: PhysicalWorkerRecord<Dispatch>, value: Dispatch) {
		const commandId = record.dispatchCommandId;
		const task = record.deliveryTail
			? record.deliveryTail.catch(() => undefined).then(() => this.options.adapter.dispatch(value, record.snapshot))
			: Promise.resolve().then(() => this.options.adapter.dispatch(value, record.snapshot));
		record.deliveryTail = task;
		record.inFlight.add(task);
		task.catch(error =>
			this.options.onSignal?.({ kind: 'fault', commandId, identity: record.identity, error: toError(error) }),
		);
		void task.then(
			() => record.inFlight.delete(task),
			() => record.inFlight.delete(task),
		);
		return task;
	}

	private close(record: PhysicalWorkerRecord<Dispatch>) {
		if (!record.closePromise) {
			record.state = 'closing';
			record.resolveClosed();
			record.buffer.length = 0;
			const connection = record.connectionPromise ?? Promise.resolve(record.connection);
			record.closePromise = connection
				.then(
					value => value?.close(),
					() => undefined,
				)
				.then(() => Promise.allSettled(record.inFlight))
				.then(
					() => {
						record.state = 'closed';
						this.release(record);
					},
					error => {
						record.state = 'failed';
						throw error;
					},
				);
		}
		return record.closePromise;
	}

	private isCurrent(record: PhysicalWorkerRecord<Dispatch>, state: LocalState) {
		return this.slots.get(record.identity.slot) === record && record.state === state;
	}

	private replay(command: PhysicalWorkerCommand, inputFingerprint: string) {
		const key = operationKey(command.identity, command.commandId);
		const previous = this.recent.get(key);
		if (!previous) return;
		this.recent.delete(key);
		this.recent.set(key, previous);
		if (previous.fingerprint === inputFingerprint) return previous.task;
		return Promise.resolve(this.reject(command, 'invalid-command', 'commandId was already used for different input'));
	}

	private track(command: PhysicalWorkerCommand, inputFingerprint: string, run: () => Promise<PhysicalWorkerReceipt>) {
		this.pruneRecent();
		if (this.recent.size >= RECENT_OPERATION_LIMIT) {
			return Promise.resolve(
				this.reject(command, 'invalid-state', 'The bounded recent-command window is busy; retry later'),
			);
		}
		const entry: RecentOperation = {
			operation: command.kind,
			fingerprint: inputFingerprint,
			task: Promise.resolve().then(run),
			settled: false,
		};
		this.recent.set(operationKey(command.identity, command.commandId), entry);
		void entry.task.then(
			() => (entry.settled = true),
			() => (entry.settled = true),
		);
		return entry.task;
	}

	private pruneRecent() {
		while (this.recent.size >= RECENT_OPERATION_LIMIT) {
			const settled = [...this.recent].find(([, entry]) => entry.settled);
			if (!settled) return;
			this.recent.delete(settled[0]);
		}
	}

	private release(record: PhysicalWorkerRecord<Dispatch>) {
		if (this.slots.get(record.identity.slot) === record) this.slots.delete(record.identity.slot);
		const key = identityKey(record.identity);
		this.closedIdentities.delete(key);
		this.closedIdentities.set(key, true);
		while (this.closedIdentities.size > CLOSED_IDENTITY_LIMIT) {
			this.closedIdentities.delete(this.closedIdentities.keys().next().value!);
		}
	}

	private retireIdentity(identity: PhysicalWorkerIdentity) {
		const prefix = `${identityKey(identity)}\0`;
		for (const [key, entry] of this.recent) {
			if (key.startsWith(prefix) && entry.operation !== 'close') this.recent.delete(key);
		}
	}

	private accept(
		command: PhysicalWorkerCommand,
		state: Extract<LocalState, 'standby' | 'armed' | 'active' | 'drained' | 'closed'>,
		replayed?: number,
	): PhysicalWorkerReceipt {
		return {
			kind: 'accepted',
			operation: command.kind,
			commandId: command.commandId,
			identity: command.identity,
			state,
			...(replayed === undefined ? {} : { replayed }),
		};
	}

	private invalidState(record: PhysicalWorkerRecord<Dispatch>, command: PhysicalWorkerCommand) {
		return this.reject(command, 'invalid-state', `Cannot ${command.kind} while local state is ${record.state}`);
	}

	private reject(
		command: PhysicalWorkerCommandEnvelope,
		reason: PhysicalWorkerRejection,
		detail: string,
	): PhysicalWorkerReceipt {
		return {
			kind: 'rejected',
			operation: command.kind,
			commandId: command.commandId,
			identity: command.identity,
			reason,
			detail,
		};
	}
}

type PhysicalWorkerCommandEnvelope = PhysicalWorkerCommandBase & { kind: PhysicalWorkerCommand['kind'] };
type PreparedCommand = { command: PhysicalWorkerCommand; fingerprint: string } | { detail: string };
const commandKinds = new Set<PhysicalWorkerCommand['kind']>(['launch', 'hydrate', 'arm', 'drain', 'activate', 'close']);

function prepareCommand(input: unknown): PreparedCommand {
	try {
		if (!isRecord(input)) return { detail: 'Command must be an object' };
		if (!isCommandKind(input.kind)) return { detail: 'Command kind is invalid' };
		if (typeof input.commandId !== 'string' || !input.commandId)
			return { detail: 'commandId must be a non-empty string' };
		if (!isRecord(input.identity)) return { detail: 'identity must be an object' };
		if (typeof input.identity.slot !== 'string' || !input.identity.slot)
			return { detail: 'identity.slot must be a non-empty string' };
		if (typeof input.identity.token !== 'string' || !input.identity.token)
			return { detail: 'identity.token must be a non-empty string' };
		const identity = Object.freeze({ slot: input.identity.slot, token: input.identity.token });
		let command: PhysicalWorkerCommand;
		switch (input.kind) {
			case 'launch': {
				if (!isRecord(input.topology)) return { detail: 'topology must be an object' };
				const { shardStart, shardEnd, totalShards } = input.topology;
				if (![shardStart, shardEnd, totalShards, input.maxBufferedDispatches].every(Number.isSafeInteger))
					return { detail: 'Topology and buffer bound must be integers' };
				if (
					(shardStart as number) < 0 ||
					(shardEnd as number) <= (shardStart as number) ||
					(shardEnd as number) > (totalShards as number) ||
					(input.maxBufferedDispatches as number) < 1
				)
					return { detail: 'Invalid exclusive shard range or buffer bound' };
				command = Object.freeze({
					kind: input.kind,
					commandId: input.commandId,
					identity,
					topology: Object.freeze({
						shardStart: shardStart as number,
						shardEnd: shardEnd as number,
						totalShards: totalShards as number,
					}),
					maxBufferedDispatches: input.maxBufferedDispatches as number,
				});
				break;
			}
			case 'hydrate':
				if (!isRecord(input.snapshot)) return { detail: 'snapshot must be an object' };
				command = Object.freeze({
					kind: input.kind,
					commandId: input.commandId,
					identity,
					snapshot: Object.freeze({ ...input.snapshot }),
				});
				break;
			default:
				command = Object.freeze({ kind: input.kind, commandId: input.commandId, identity });
		}
		return { command, fingerprint: fingerprint(command) };
	} catch (error) {
		return { detail: `Command could not be read safely: ${toError(error).message}` };
	}
}

function invalidCommandEnvelope(input: unknown): PhysicalWorkerCommandEnvelope {
	try {
		const value = isRecord(input) ? input : undefined;
		const rawIdentity = value && isRecord(value.identity) ? value.identity : undefined;
		return {
			kind: value && isCommandKind(value.kind) ? value.kind : 'close',
			commandId: value && typeof value.commandId === 'string' ? value.commandId : '',
			identity: Object.freeze({
				slot: rawIdentity && typeof rawIdentity.slot === 'string' ? rawIdentity.slot : '',
				token: rawIdentity && typeof rawIdentity.token === 'string' ? rawIdentity.token : '',
			}),
		};
	} catch {
		return { kind: 'close', commandId: '', identity: Object.freeze({ slot: '', token: '' }) };
	}
}

function isCommandKind(value: unknown): value is PhysicalWorkerCommand['kind'] {
	return typeof value === 'string' && commandKinds.has(value as PhysicalWorkerCommand['kind']);
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function fingerprint(value: unknown) {
	const result = JSON.stringify(value);
	if (result === undefined) throw new TypeError('Command must be serializable');
	return result;
}

function identityKey(identity: PhysicalWorkerIdentity) {
	return `${identity.slot}\0${identity.token}`;
}

function operationKey(identity: PhysicalWorkerIdentity, commandId: string) {
	return `${identityKey(identity)}\0${commandId}`;
}

function isClosed(record: PhysicalWorkerRecord<unknown>) {
	return record.state === 'closing' || record.state === 'closed' || record.state === 'failed';
}

function toError(error: unknown) {
	return error instanceof Error ? error : new Error(String(error));
}
