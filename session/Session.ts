import type { DiscordGetGatewayBot, GatewayBot, GatewayIntents } from "../vendor/external.ts";
import type { DiscordGatewayPayload, Shard } from "../vendor/external.ts";
import type { Events } from "../handlers/Actions.ts";

import { Snowflake } from "../util/Snowflake.ts";
import { EventEmitter } from "../util/EventEmmiter.ts";
import { createGatewayManager, createRestManager } from "../vendor/external.ts";

import * as Routes from "../util/Routes.ts";
import * as Actions from "../handlers/Actions.ts";

export type DiscordRawEventHandler = (shard: Shard, data: DiscordGatewayPayload) => unknown;

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
 */
export class Session extends EventEmitter {
    options: SessionOptions;

    // TODO: improve this with CreateShardManager etc
    rest: ReturnType<typeof createRestManager>;
    gateway: ReturnType<typeof createGatewayManager>;

    constructor(options: SessionOptions) {
        super();
        this.options = options;

        const defHandler: DiscordRawEventHandler = (shard, data) => {
            Actions.raw(this, shard.id, data);

            if (!data.t) {
                return;
            }

            // deno-lint-ignore no-explicit-any
            Actions[data.t as keyof typeof Actions]?.(this, shard.id, data.d as any);
        };

        this.rest = createRestManager({
            token: this.options.token,
            debug: (text) => {
                // TODO: set this using the event emitter
                super.rawListeners("debug")?.forEach((fn) => fn(text));
            },
            secretKey: this.options.rest?.secretKey ?? undefined,
        });

        this.gateway = createGatewayManager({
            gatewayBot: this.options.gateway?.data ?? {} as GatewayBot, // TODO
            gatewayConfig: {
                token: this.options.token,
                intents: this.options.intents,
            },
            handleDiscordPayload: this.options.rawHandler ?? defHandler,
        });
        // TODO: set botId in Session.botId or something
    }

    override on<K extends keyof Events>(event: K, func: Events[K]): this;
    override on<K extends string>(event: K, func: (...args: unknown[]) => unknown): this {
        return super.on(event, func);
    }

    override off<K extends keyof Events>(event: K, func: Events[K]): this;
    override off<K extends string>(event: K, func: (...args: unknown[]) => unknown): this {
        return super.off(event, func);
    }

    override once<K extends keyof Events>(event: K, func: Events[K]): this;
    override once<K extends string>(event: K, func: (...args: unknown[]) => unknown): this {
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
