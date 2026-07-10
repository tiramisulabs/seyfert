import type { CustomWorkerManagerEvents } from '../..';
import type { Identify } from '../../common';
import type { GatewayPresenceUpdateData, GatewaySendPayload } from '../../types';
import type { ShardOptions, WorkerGenerationTarget } from './shared';

type CreateManagerMessage<T extends string, D extends object = object> = { type: T } & D &
	Partial<WorkerGenerationTarget>;

export type ManagerAllowConnect = CreateManagerMessage<
	'ALLOW_CONNECT',
	{ shardId: number; presence?: GatewayPresenceUpdateData }
>;
export type ManagerAllowConnectResharding = CreateManagerMessage<
	'ALLOW_CONNECT_RESHARDING',
	{ shardId: number; presence?: GatewayPresenceUpdateData }
>;
export type ManagerWorkerAlreadyExistsResharding = CreateManagerMessage<'WORKER_ALREADY_EXISTS_RESHARDING'>;
export type ManagerSpawnShards = CreateManagerMessage<
	'SPAWN_SHARDS',
	Pick<ShardOptions, 'info' | 'properties' | 'compress'>
>;
export type ManagerSpawnShardsResharding = CreateManagerMessage<
	'SPAWN_SHARDS_RESHARDING',
	Pick<ShardOptions, 'info' | 'properties' | 'compress'>
>;
export type DisconnectAllShardsResharding = CreateManagerMessage<'DISCONNECT_ALL_SHARDS_RESHARDING'>;
export type ConnnectAllShardsResharding = CreateManagerMessage<
	'CONNECT_ALL_SHARDS_RESHARDING',
	{ totalShards: number }
>;
export type ManagerActivateWorkerGeneration = CreateManagerMessage<'ACTIVATE_WORKER_GENERATION'>;
export type ManagerBeginWorkerGenerationCutover = CreateManagerMessage<'BEGIN_WORKER_GENERATION_CUTOVER'>;
export type ManagerDrainWorkerGeneration = CreateManagerMessage<'DRAIN_WORKER_GENERATION'>;
export type ManagerAbortWorkerGeneration = CreateManagerMessage<'ABORT_WORKER_GENERATION'>;
export type ManagerRenewWorkerSupervisorLease = CreateManagerMessage<
	'RENEW_WORKER_SUPERVISOR_LEASE',
	{ expiresInMs: number; issuedAtMonotonicMs: number; sequence: number }
>;
export type ManagerSendPayload = CreateManagerMessage<
	'SEND_PAYLOAD',
	GatewaySendPayload & { shardId: number; nonce: string }
>;
export type ManagerRequestShardInfo = CreateManagerMessage<'SHARD_INFO', { nonce: string; shardId: number }>;
export type ManagerRequestWorkerInfo = CreateManagerMessage<'WORKER_INFO', { nonce: string }>;
export type ManagerSendCacheResult = CreateManagerMessage<'CACHE_RESULT', { nonce: string; result: any }>;
export type ManagerSendBotReady = CreateManagerMessage<'BOT_READY'>;
export type ManagerSendApiResponse = CreateManagerMessage<
	'API_RESPONSE',
	{ response: any; error?: any; nonce: string }
>;
export type ManagerExecuteEvalToWorker = CreateManagerMessage<
	'EXECUTE_EVAL_TO_WORKER',
	{ func: string; nonce: string; vars: string; toWorkerId: number }
>;
export type ManagerExecuteEval = CreateManagerMessage<'EXECUTE_EVAL', { func: string; vars: string; nonce: string }>;
export type ManagerSendEvalResponse = CreateManagerMessage<'EVAL_RESPONSE', { response: any; nonce: string }>;

export type BaseManagerMessages =
	| ManagerAllowConnect
	| ManagerSpawnShards
	| ManagerSendPayload
	| ManagerRequestShardInfo
	| ManagerRequestWorkerInfo
	| ManagerSendCacheResult
	| ManagerSendBotReady
	| ManagerSendApiResponse
	| ManagerSendEvalResponse
	| ManagerExecuteEvalToWorker
	| ManagerWorkerAlreadyExistsResharding
	| ManagerSpawnShardsResharding
	| ManagerAllowConnectResharding
	| DisconnectAllShardsResharding
	| ConnnectAllShardsResharding
	| ManagerActivateWorkerGeneration
	| ManagerBeginWorkerGenerationCutover
	| ManagerDrainWorkerGeneration
	| ManagerAbortWorkerGeneration
	| ManagerRenewWorkerSupervisorLease
	| ManagerExecuteEval;

export type CustomManagerMessages = {
	[K in keyof CustomWorkerManagerEvents]: Identify<
		{ type: K } & Partial<WorkerGenerationTarget> &
			Identify<CustomWorkerManagerEvents[K] extends never ? {} : CustomWorkerManagerEvents[K]>
	>;
};

export type ManagerMessages =
	| {
			[K in BaseManagerMessages['type']]: Identify<Extract<BaseManagerMessages, { type: K }>>;
	  }[BaseManagerMessages['type']]
	| CustomManagerMessages[keyof CustomManagerMessages];
