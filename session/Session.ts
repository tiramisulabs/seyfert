import type {
    DiscordGatewayPayload,
    DiscordGetGatewayBot,
    DiscordMessage,
    DiscordReady,
    GatewayBot,
    GatewayDispatchEventNames,
    GatewayIntents,
    Shard,
} from "../vendor/external.ts";

import { EventEmitter, Routes, Snowflake } from "../util/mod.ts";

import type { DiscordRawEventHandler, Events } from "./Events.ts";

import { createGatewayManager, createRestManager } from "../vendor/external.ts";

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
    rest?: ReturnType<typeof createRestManager>;
    gateway?: ReturnType<typeof createGatewayManager>;

    constructor(options: SessionOptions) {
        super();
        this.options = options;
        // TODO: set botId in Session.botId or something
    }

    /** TODO: move this */
    static #toSnakeCase(str: string) {
        // probably not a fast implementation
        return str.replace(/[A-Z]/g, (char) => "_" + char.toLowerCase());
    }

    override on(event: "ready", func: Events["ready"]): this;
    override on(event: "messageCreate", func: Events["messageCreate"]): this;
    override on(event: "raw", func: Events["raw"]): this;
    override on(event: keyof Events, func: Events[keyof Events]): this {
        return super.on(Session.#toSnakeCase(event), func);
    }

    override off(event: "ready", func: Events["ready"]): this;
    override off(event: "messageCreate", func: Events["messageCreate"]): this;
    override off(event: "raw", func: Events["raw"]): this;
    override off(event: keyof Events, func: Events[keyof Events]): this {
        return super.off(Session.#toSnakeCase(event), func);
    }

    override once(event: "ready", func: Events["ready"]): this;
    override once(event: "messageCreate", func: Events["messageCreate"]): this;
    override once(event: "raw", func: Events["raw"]): this;
    override once(event: keyof Events, func: Events[keyof Events]): this {
        return super.once(Session.#toSnakeCase(event), func);
    }

    async start() {
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

        const getGatewayBot = () => this.rest!.runMethod<DiscordGetGatewayBot>(this.rest!, "GET", Routes.GATEWAY_BOT());

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
