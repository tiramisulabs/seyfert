import type {
	GatewayIntents,
	DiscordGatewayPayload,
	DiscordGetGatewayBot,
	DiscordReady,
	DiscordMessage,
	GatewayDispatchEventNames,
	GatewayBot,
	Shard
} from "../vendor/external.ts";

import {
	EventEmitter,
	Snowflake,
	Routes
} from "../util/mod.ts";

import type {
	DiscordRawEventHandler,
} from "./Events.ts";

import {
	createRestManager,
	createGatewayManager
} from "../vendor/external.ts";

export interface RestOptions {
	secretKey?: string;
	applicationId?: Snowflake;
}

export interface GatewayOptions {
	botId?: Snowflake;
	data?: GatewayBot;
}

export interface SessionOptions {
	token: string;
	rawHandler?: DiscordRawEventHandler;
	intents?: GatewayIntents;
	rest?: RestOptions;
	gateway?: GatewayOptions;	
}

/**
 * Receives a Token, connects
 * */
export class Session extends EventEmitter {
	options: SessionOptions;

	// TODO: improve this with CreateShardManager etc
	rest: ReturnType<typeof createRestManager>;
	gateway: ReturnType<typeof createGatewayManager>;

	constructor(options: SessionOptions) {
		super();
		this.options = options;

		const defHandler: DiscordRawEventHandler = (shard, data) => {
			this.emit("raw", data, shard.id);

			if (!data.t) return;

			this.emit(data.t as GatewayDispatchEventNames, data, shard.id);
		};

		this.rest = createRestManager({
			token: this.options.token,
			debug: (text) => {
				// TODO: set this using the event emitter
				super.rawListeners("debug")?.forEach((fn) => fn(text));
			},
			secretKey: this.options.rest?.secretKey ?? undefined
		});

		this.gateway = createGatewayManager({
			gatewayBot: options.gateway?.data ?? {} as GatewayBot, // TODO
			gatewayConfig: {
				token: options.token,
				intents: options.intents
			},
			handleDiscordPayload: options.rawHandler ?? defHandler
		});

		// TODO: set botId in Session.botId or something
	}

	override on(event: "ready", func: (payload: DiscordReady) => unknown): this;
	override on(event: "raw", func: (shard: Shard, data: DiscordGatewayPayload) => unknown): this;
	override on(event: "message", func: (message: DiscordMessage) => unknown): this;
	override on(event: "debug", func: (text: string) => unknown): this;
	override on(event: string, func: Function): this {
		return super.on(event, func);
	}

	override off(event: string, func: Function): this {
		return super.off(event, func);
	}

	override once(event: string, func: Function): this {
		return super.once(event, func);
	}

	async start() {
		const getGatewayBot = () => this.rest.runMethod<DiscordGetGatewayBot>(this.rest, "GET", Routes.GATEWAY_BOT());

		// check if is empty
		if (!Object.keys(this.options.gateway?.data ?? {}).length) {
			const nonParsed = await getGatewayBot();

			this.gateway.gatewayBot = {
				url: nonParsed.url,
				shards: nonParsed.shards,
				sessionStartLimit: {
					total: nonParsed.session_start_limit.total,
					remaining: nonParsed.session_start_limit.remaining,
					resetAfter: nonParsed.session_start_limit.reset_after,
					maxConcurrency: nonParsed.session_start_limit.max_concurrency,
				},
			};
			this.gateway.lastShardId = this.gateway.gatewayBot.shards - 1;
			this.gateway.manager.totalShards = this.gateway.gatewayBot.shards;
		}

		this.gateway.spawnShards();
	}
}


