import type { ApiRequestOptions, HttpMethods } from '../..';
import type { GatewayDispatchPayload } from '../../common';

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
			| 'get'
			| 'set'
			| 'patch'
			| 'values'
			| 'keys'
			| 'count'
			| 'remove'
			| 'contains'
			| 'getToRelationship'
			| 'bulkAddToRelationShip'
			| 'addToRelationship'
			| 'removeRelationship'
			| 'removeToRelationship';
		args: any[];
	}
>;
export type WorkerSendShardInfo = CreateWorkerMessage<'SHARD_INFO', WorkerShardInfo & { nonce: string }>;
export type WorkerSendInfo = CreateWorkerMessage<'WORKER_INFO', WorkerInfo & { nonce: string }>;
export type WorkerReady = CreateWorkerMessage<'WORKER_READY'>;
export type WorkerSendApiRequest = CreateWorkerMessage<
	'WORKER_API_REQUEST',
	{
		method: HttpMethods;
		url: `/${string}`;
		requestOptions: ApiRequestOptions;
		nonce: string;
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
	| WorkerSendApiRequest;
