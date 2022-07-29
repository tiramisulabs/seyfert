import type {
	DiscordGatewayPayload,
	GatewayIntents,
	Snowflake,
} from '@biscuitland/api-types';

// DiscordGetGatewayBot;

import type { RestAdapter } from '@biscuitland/rest';
import { DefaultRestAdapter } from '@biscuitland/rest';

import type { WsAdapter } from '@biscuitland/ws';
import { DefaultWsAdapter } from '@biscuitland/ws';

import type { EventAdapter } from './adapters/event-adapter';
import { DefaultEventAdapter } from './adapters/default-event-adapter';

import { Util } from './utils/util';
import { Shard } from '@biscuitland/ws';

export type DiscordRawEventHandler = (
	shard: Shard,
	data: MessageEvent<any>
) => unknown;

export type PickOptions = Pick<
	BiscuitOptions,
	Exclude<keyof BiscuitOptions, keyof typeof Session.DEFAULTS>
> &
	Partial<BiscuitOptions>;

export interface BiscuitOptions {
	intents?: GatewayIntents;
	token: string;

	events?: {
		adapter?: { new (...args: any[]): EventAdapter };
		options: any;
	};

	rest: {
		adapter?: { new (...args: any[]): RestAdapter };
		options: any;
	};

	ws: {
		adapter?: { new (...args: any[]): WsAdapter };
		options: any;
	};
}
import * as Actions from './adapters/events';

export class Session {
	#applicationId?: Snowflake;
	#botId?: Snowflake;
	token: string;

	set botId(snowflake: Snowflake) {
		this.#botId = snowflake;
	}

	get botId(): Snowflake {
		return this.#botId ?? Util.getBotIdFromToken(this.token);
	}

	set applicationId(snowflake: Snowflake) {
		this.#applicationId = snowflake;
	}

	get applicationId(): Snowflake {
		return this.#applicationId ?? this.botId;
	}

	static readonly DEFAULTS = {
		rest: {
			adapter: DefaultRestAdapter,
			options: null,
		},
		ws: {
			adapter: DefaultWsAdapter,
			options: null,
		},
	};

	options: BiscuitOptions;

	readonly events: EventAdapter;

	readonly rest: RestAdapter;
	readonly ws: WsAdapter;

	private adapters = new Map<string, any>();

	constructor(options: PickOptions) {
		this.options = Object.assign(options, Session.DEFAULTS);

		// makeRest

		if (!this.options.rest.options) {
			this.options.rest.options = {
				intents: this.options.intents,
				token: this.options.token,
			};
		}

		this.rest = this.getRest();

		// makeWs

		const defHandler: DiscordRawEventHandler = (shard, event) => {
			let message = event.data;
			let data = JSON.parse(message) as DiscordGatewayPayload;

			Actions.raw(this, shard.id, data);

			if (!data.t || !data.d) {
				return;
			}

			Actions[data.t as keyof typeof Actions]?.(
				this,
				shard.id,
				data.d as any
			);
		};

		if (!this.options.ws.options) {
			this.options.ws.options = {
				handleDiscordPayload: defHandler,

				gatewayConfig: {
					token: this.options.token,
					intents: this.options.intents,
				},

				intents: this.options.intents,
				token: this.options.token,
			};
		}

		// makeEvents

		this.events = this.options.events?.adapter
			? new this.options.events.adapter()
			: new DefaultEventAdapter();

		this.ws = this.getWs();
		this.token = options.token;
	}

	/**
	 * @inheritDoc
	 */

	private getAdapter<T extends { new (...args: any[]): InstanceType<T> }>(
		adapter: T,
		...args: ConstructorParameters<T>
	): InstanceType<T> {
		if (!this.adapters.has(adapter.name)) {
			const Class = adapter as { new (...args: any[]): T };
			this.adapters.set(adapter.name, new Class(...args));
		}

		return this.adapters.get(adapter.name);
	}

	/**
	 * @inheritDoc
	 */

	private getRest(): RestAdapter {
		return this.getAdapter(
			this.options.rest.adapter!,
			this.options.rest.options
		);
	}

	/**
	 * @inheritDoc
	 */

	private getWs(): WsAdapter {
		return this.getAdapter(
			this.options.ws.adapter!,
			this.options.ws.options
		);
	}

	/**
	 * @inheritDoc
	 */

	async start(): Promise<void> {
		const nonParsed = await this.rest.get<any>('/gateway/bot');

		this.ws.options.gatewayBot = {
			url: nonParsed.url,
			shards: nonParsed.shards,
			sessionStartLimit: {
				total: nonParsed.session_start_limit.total,
				remaining: nonParsed.session_start_limit.remaining,
				resetAfter: nonParsed.session_start_limit.reset_after,
				maxConcurrency: nonParsed.session_start_limit.max_concurrency,
			},
		};

		this.ws.options.lastShardId = this.ws.options.gatewayBot.shards - 1;
		this.ws.agent.options.totalShards = this.ws.options.gatewayBot.shards;

		this.ws.shards();
	}
}
