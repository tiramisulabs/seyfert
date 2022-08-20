import type { Agent } from '../services/agent';
import type { GatewayBot } from '@biscuitland/api-types';

export interface WsAdapter {
	options: Partial<Options | any>;

	/**
	 * @inheritDoc
	 */

	agent: Agent;

	/**
	 * @inheritDoc
	 */

	shards(): void;
}

interface Options {
	/** Id of the first Shard which should get controlled by this manager. */
	firstShardId: number;

	/** Id of the last Shard which should get controlled by this manager. */
	lastShardId: number;

	/** Important data which is used by the manager to connect shards to the gateway. */
	gatewayBot: GatewayBot;
}
