import type { ApiRequestOptions, HttpMethods } from '../..';
import type { GatewayDispatchPayload } from '../../types';

export interface WorkerShardInfo {
	open: boolean;
	shardId: number;
	latency: number;
	resumable: boolean;
}

export type WorkerInfo = { shards: WorkerShardInfo[] };

type CreateWorkerMessage<T extends string, D extends object = {}> = {
	type: T;
	workerId: number;
} & D;

export type WorkerRequestConnect = CreateWorkerMessage<'CONNECT_QUEUE', { shardId: number }>;
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
export type WorkerShardsConnected = CreateWorkerMessage<'WORKER_SHARDS_CONNECTED'>;
export type WorkerStart = CreateWorkerMessage<'WORKER_START'>;
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

export type WorkerSendEval = CreateWorkerMessage<
	'EVAL',
	{
		func: string;
		nonce: string;
		toWorkerId: number;
	}
>;

export type WorkerMessage =
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
	| WorkerSendEval
	| WorkerStart;
