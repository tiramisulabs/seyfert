import type { ApiRequestOptions, CustomWorkerClientEvents, HttpMethods } from '../..';
import type { Identify } from '../../common';
import type { GatewayDispatchPayload } from '../../types';

export interface WorkerShardInfo {
	open: boolean;
	shardId: number;
	latency: number;
	resumable: boolean;
	workerId: number;
}

export type WorkerInfo = { shards: WorkerShardInfo[] };

type CreateWorkerMessage<T extends string, D extends object = object> = {
	type: T;
	workerId: number;
} & D;

export type WorkerRequestConnect = CreateWorkerMessage<'CONNECT_QUEUE', { shardId: number }>;
export type WorkerRequestConnectResharding = CreateWorkerMessage<'CONNECT_QUEUE_RESHARDING', { shardId: number }>;
export type WorkerReceivePayload = CreateWorkerMessage<
	'RECEIVE_PAYLOAD',
	{ shardId: number; payload: GatewayDispatchPayload }
>;
export type WorkerSendResultPayload = CreateWorkerMessage<'RESULT_PAYLOAD', { nonce: string }>;
export type WorkerSendCacheRequest = CreateWorkerMessage<
	'CACHE_REQUEST',
	{
		nonce: string;
		method:
			| 'scan'
			| 'bulkGet'
			| 'get'
			| 'bulkSet'
			| 'set'
			| 'bulkPatch'
			| 'patch'
			| 'values'
			| 'keys'
			| 'count'
			| 'bulkRemove'
			| 'remove'
			| 'flush'
			| 'contains'
			| 'getToRelationship'
			| 'bulkAddToRelationShip'
			| 'addToRelationship'
			| 'removeRelationship'
			| 'removeToRelationship';
		args: unknown[];
	}
>;
export type WorkerSendShardInfo = CreateWorkerMessage<'SHARD_INFO', WorkerShardInfo & { nonce: string }>;
export type WorkerSendInfo = CreateWorkerMessage<'WORKER_INFO', WorkerInfo & { nonce: string }>;
export type WorkerReady = CreateWorkerMessage<'WORKER_READY'>;
export type WorkerReadyResharding = CreateWorkerMessage<'WORKER_READY_RESHARDING'>;
export type WorkerShardsConnected = CreateWorkerMessage<'WORKER_SHARDS_CONNECTED'>;
export type WorkerStart = CreateWorkerMessage<'WORKER_START'>;
export type WorkerStartResharding = CreateWorkerMessage<'WORKER_START_RESHARDING'>;
export type WorkerDisconnectedAllShardsResharding = CreateWorkerMessage<'DISCONNECTED_ALL_SHARDS_RESHARDING'>;
export type WorkerSendApiRequest = CreateWorkerMessage<
	'WORKER_API_REQUEST',
	{
		method: HttpMethods;
		url: `/${string}`;
		requestOptions: ApiRequestOptions;
		nonce: string;
	}
>;

export type WorkerSendEvalResponse = CreateWorkerMessage<
	'EVAL_RESPONSE',
	{
		response: unknown;
		nonce: string;
	}
>;

export type WorkerSendToWorkerEval = CreateWorkerMessage<
	'EVAL_TO_WORKER',
	{
		func: string;
		nonce: string;
		vars: string;
		toWorkerId: number;
	}
>;

export type BaseWorkerMessage =
	| WorkerRequestConnect
	| WorkerReceivePayload
	| WorkerSendResultPayload
	| WorkerSendCacheRequest
	| WorkerSendShardInfo
	| WorkerSendInfo
	| WorkerReady
	| WorkerShardsConnected
	| WorkerSendApiRequest
	| WorkerSendEvalResponse
	| WorkerSendToWorkerEval
	| WorkerStart
	| WorkerStartResharding
	| WorkerRequestConnectResharding
	| WorkerReadyResharding
	| WorkerDisconnectedAllShardsResharding;

export type CustomWorkerClientMessages = {
	[K in keyof CustomWorkerClientEvents]: Identify<
		{
			type: K;
			workerId: number;
		} & Identify<CustomWorkerClientEvents[K] extends never ? {} : CustomWorkerClientEvents[K]>
	>;
};

export type ClientHeartbeaterMessages = ACKHeartbeat;

export type ACKHeartbeat = CreateWorkerMessage<'ACK_HEARTBEAT'>;

export type WorkerMessages =
	| ClientHeartbeaterMessages
	| {
			[K in BaseWorkerMessage['type']]: Identify<Extract<BaseWorkerMessage, { type: K }>>;
	  }[BaseWorkerMessage['type']]
	| CustomWorkerClientMessages[keyof CustomWorkerClientMessages];
