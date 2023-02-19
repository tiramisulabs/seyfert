import type { BiscuitRESTOptions, CDNRoutes, Routes } from "@biscuitland/rest";
import { CDN, BiscuitREST, Router } from "@biscuitland/rest";
import type { RestAdapater } from "@biscuitland/common";
import { EventEmitter2 } from "eventemitter2";
import { Utils } from ".";
import { MainManager } from "./structures/managers/MainManager";
import { Events } from "./events/handler";
import { WebSocketManager, WebSocketManagerOptions, WebSocketShardEvents } from "@biscuitland/ws";
import { GatewayIntentBits } from "discord-api-types/v10";

import * as Actions from "./events/handler";

export class Session<RA extends RestAdapater<any> = BiscuitREST,> extends EventEmitter2 {
	constructor(public options: BiscuitOptions<RA>) {
		super();
		this.createRest(this.options.rest);
		this.api = new Router(this.rest).createProxy();
		this.cdn = CDN.createProxy();
		this.managers = new MainManager(this);
		this.websocket = new WebSocketManager({
			token: this.options.token,
			rest: this.rest,
			intents: this.options.intents ?? 0,
			...this.options.ws.manager,
		});
	}

	utils = Utils;
	rest!: RA | BiscuitREST;
	api: Routes<RA | BiscuitREST>;
	cdn: CDNRoutes;
	managers: MainManager;
	websocket: WebSocketManager;
	private _applicationId?: string;
	private _botId?: string;
	override on<K extends keyof Events>(event: K, func: Events[K]): this;
	override on<K extends string>(event: K, func: (...args: unknown[]) => unknown): this {
		const ev = super.on(event, func);

		// @ts-expect-error Eventemitter can sometimes return a listener
		return ev.emitter ? ev.emitter : ev;
	}
	override off<K extends keyof Events>(event: K, func: Events[K]): this;
	override off<K extends keyof Events>(event: K, func: (...args: unknown[]) => unknown): this {
		return super.off(event, func);
	}

	override once<K extends keyof Events>(event: K, func: Events[K]): this;
	override once<K extends string>(event: K, func: (...args: unknown[]) => unknown): this {
		const ev = super.on(event, func);

		// @ts-expect-error Eventemitter can sometimes return a listener
		return ev.emitter ? ev.emitter : ev;
	}

	override emit<K extends keyof Events>(event: K, ...params: Parameters<Events[K]>): boolean;
	override emit<K extends string>(event: K, ...params: unknown[]): boolean {
		return super.emit(event, ...params);
	}

	set botId(id: string) {
		this._botId = id;
	}

	set applicationId(id: string) {
		this._applicationId = id;
	}

	get botId() {
		return this._botId ?? this.utils.getBotIdFromToken(this.options.token);
	}

	get applicationId() {
		return this._applicationId ?? this.botId;
	}

	private createRest(rest: any) {
		if (!rest) {
			this.rest = new BiscuitREST({ ...this.options.defaultRestOptions }).setToken(this.options.token);
			return;
		}

		if (rest instanceof BiscuitREST || rest.cRest) {
			this.rest = rest;
			return;
		}

		throw new Error("[CORE] REST not found");
	}

	async start() {
		this.websocket.on(WebSocketShardEvents.Dispatch, (payload) => {
			if (!payload.data.d || !payload.data.t) return;
			const { shardId, ...p } = payload;
			const action = Actions[payload.data.t];
			if (action) action(this, shardId, p.data.d);
		});

		await this.websocket.connect();
	}
}

export interface BiscuitOptions<RA extends RestAdapater<any>> {
	token: string;
	intents: number | GatewayIntentBits;
	rest: RA;
	defaultRestOptions: Partial<BiscuitRESTOptions>;
	ws: {
		manager: Omit<WebSocketManagerOptions, "token" | "rest" | "intents">;
	};
}
