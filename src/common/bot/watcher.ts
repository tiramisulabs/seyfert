import type { GatewayDispatchPayload, GatewaySendPayload } from '../../types';
import type { ShardManager, ShardManagerOptions } from '../../websocket';
import type { PickPartial } from '../types/util';

export interface WatcherOptions
	extends PickPartial<
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
		| 'resharding'
		| 'debug'
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
