import type { CustomWorkerManagerEvents } from '../..';
import type { Identify } from '../../common';
import type { GatewayPresenceUpdateData, GatewaySendPayload } from '../../types';
import type { ShardOptions } from './shared';

type CreateManagerMessage<T extends string, D extends object = object> = {
	type: T;
	incarnationId: string;
} & D;

export type ManagerAllowConnect = CreateManagerMessage<
	'ALLOW_CONNECT',
	{ shardId: number; presence?: GatewayPresenceUpdateData }
>;
export type ManagerAllowConnectResharding = CreateManagerMessage<
	'ALLOW_CONNECT_RESHARDING',
	{ shardId: number; presence?: GatewayPresenceUpdateData; reshardId: string }
>;
export type ManagerWorkerAlreadyExistsResharding = CreateManagerMessage<
	'WORKER_ALREADY_EXISTS_RESHARDING',
	{ reshardId: string }
>;
export type ManagerSpawnShards = CreateManagerMessage<
	'SPAWN_SHARDS',
	Pick<ShardOptions, 'info' | 'properties' | 'compress'>
>;
export type ManagerSpawnShardsResharding = CreateManagerMessage<
	'SPAWN_SHARDS_RESHARDING',
	Pick<ShardOptions, 'info' | 'properties' | 'compress'> & { reshardId: string }
>;
export type DisconnectAllShardsResharding = CreateManagerMessage<
	'DISCONNECT_ALL_SHARDS_RESHARDING',
	{ reshardId: string }
>;
export type ManagerAbortResharding = CreateManagerMessage<'ABORT_RESHARDING', { reshardId: string }>;
export type ConnnectAllShardsResharding = CreateManagerMessage<
	'CONNECT_ALL_SHARDS_RESHARDING',
	{
		info: ShardOptions['info'];
		totalShards: number;
		totalWorkers: number;
		reshardId: string;
	}
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
	{
		response: any;
		error?: any;
		nonce: string;
	}
>;
export type ManagerExecuteEvalToWorker = CreateManagerMessage<
	'EXECUTE_EVAL_TO_WORKER',
	{
		func: string;
		nonce: string;
		vars: string;
		toWorkerId: number;
	}
>;
export type ManagerExecuteEval = CreateManagerMessage<
	'EXECUTE_EVAL',
	{
		func: string;
		vars: string;
		nonce: string;
	}
>;
export type ManagerSendEvalResponse = CreateManagerMessage<
	'EVAL_RESPONSE',
	{
		response: any;
		nonce: string;
	}
>;

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
	| ManagerAbortResharding
	| ConnnectAllShardsResharding
	| ManagerExecuteEval;

export type CustomManagerMessages = {
	[K in keyof CustomWorkerManagerEvents]: Identify<
		{
			type: K;
			incarnationId: string;
		} & Identify<CustomWorkerManagerEvents[K] extends never ? {} : CustomWorkerManagerEvents[K]>
	>;
};

export type ManagerMessages =
	| {
			[K in BaseManagerMessages['type']]: Identify<Extract<BaseManagerMessages, { type: K }>>;
	  }[BaseManagerMessages['type']]
	| CustomManagerMessages[keyof CustomManagerMessages];
