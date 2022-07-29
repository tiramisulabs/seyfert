import type { ShardGatewayConfig, ShardOptions } from './shard';
import type { PickPartial } from '@biscuitland/api-types';

import { Shard } from './shard';

export class Agent {
	static readonly DEFAULTS = {
		shardIds: [],

		totalShards: 1,
	};

	options: Options;
	shards: Map<number, Shard>;

	constructor(options: AgentOptions) {
		this.options = Object.assign(Agent.DEFAULTS, options);

		const { handleIdentify } = this.options;

		this.shards = new Map(
			this.options.shardIds.map(id => {
				const shard = new Shard({
					id,
					totalShards: this.options.totalShards,
					gatewayConfig: this.options.gatewayConfig,

					handleMessage: (shard, message) => {
						return this.options.handleMessage(shard, message);
					},

					handleIdentify: async function () {
						return await handleIdentify(id);
					},

					...this.options.createShardOptions,
				});

				return [id, shard] as const;
			})
		);
	}

	/**
	 * @inheritDoc
	 */

	async identify(id: number) {
		let shard = this.shards.get(id);

		if (!shard) {
			const { handleIdentify } = this.options;

			shard = new Shard({
				id,
				totalShards: this.options.totalShards,
				gatewayConfig: this.options.gatewayConfig,

				handleMessage: (shard, message) => {
					return this.options.handleMessage(shard, message);
				},

				handleIdentify: async function () {
					return await handleIdentify(id);
				},

				...this.options.createShardOptions,
			});

			this.shards.set(id, shard);
		}

		return await shard.identify();
	}

	/**
	 * @inheritDoc
	 */

	async scale() {}
}

export type AgentOptions = Pick<
	Options,
	Exclude<keyof Options, keyof typeof Agent.DEFAULTS>
> &
	Partial<Options>;

interface Options {
	/** Ids of the Shards which should be managed. */
	shardIds: number[];

	/** Total amount of Shard used by the bot. */
	totalShards: number;

	/** Options which are used to create a new Shard. */
	createShardOptions?: Omit<
		ShardOptions,
		'id' | 'totalShards' | 'requestIdentify' | 'gatewayConfig'
	>;

	/** Gateway configuration which is used when creating a Shard. */
	gatewayConfig: PickPartial<ShardGatewayConfig, 'token'>;

	/** Sends the discord payload to another guild. */
	handleMessage: (shard: Shard, data: MessageEvent<any>) => any;

	/** This function communicates with the parent manager. */
	handleIdentify(shardId: number): Promise<void>;
}
