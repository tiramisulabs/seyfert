import type { BiscuitRESTOptions, CDNRoutes, Routes } from '@biscuitland/rest';
import { CDN, BiscuitREST, Router } from '@biscuitland/rest';
import { When } from '@biscuitland/common';
import { EventEmitter2 } from 'eventemitter2';
import { MainManager, getBotIdFromToken } from '.';
import { GatewayManager, CreateGatewayManagerOptions, GatewayEvents } from '@biscuitland/ws';
import { GatewayIntentBits } from '@biscuitland/common';
import { actionHandler, Handler } from './events/handler';

export class Session<On extends boolean = boolean> extends EventEmitter2 {
	constructor(public options: BiscuitOptions) {
		super();
		this.rest = this.createRest(this.options.rest);
		this.api = new Router(this.rest).createProxy();
		this.cdn = CDN.createProxy();
		this.managers = new MainManager(this);
	}
	rest: BiscuitREST;
	api: Routes<BiscuitREST>;
	cdn: CDNRoutes;
	managers: MainManager;
	gateway!: When<On, GatewayManager>;
	private _applicationId?: string;
	private _botId?: string;

	override on<K extends keyof GatewayEvents>(event: `${K}`, func: Handler[K]): this;
	override on<K extends string>(event: `${K}`, func: (...args: unknown[]) => unknown): this {
		const ev = super.on(event, func);

		// @ts-expect-error Eventemitter can sometimes return a listener
		return ev.emitter ? ev.emitter : ev;
	}
	override off<K extends keyof GatewayEvents>(event: `${K}`, func: Handler[K]): this;
	override off<K extends keyof GatewayEvents>(event: `${K}`, func: (...args: unknown[]) => unknown): this {
		return super.off(event, func);
	}

	override once<K extends keyof GatewayEvents>(event: `${K}`, func: Handler[K]): this;
	override once<K extends string>(event: `${K}`, func: (...args: unknown[]) => unknown): this {
		const ev = super.on(event, func);

		// @ts-expect-error Eventemitter can sometimes return a listener
		return ev.emitter ? ev.emitter : ev;
	}

	override emit<K extends keyof GatewayEvents>(event: `${K}`, ...params: Parameters<Handler[K]>): boolean;
	override emit<K extends string>(event: `${K}`, ...params: unknown[]): boolean {
		return super.emit(event, ...params);
	}

	set botId(id: string) {
		this._botId = id;
	}

	set applicationId(id: string) {
		this._applicationId = id;
	}

	get botId() {
		return this._botId ?? getBotIdFromToken(this.options.token);
	}

	get applicationId() {
		return this._applicationId ?? this.botId;
	}

	private createRest(rest: any) {
		if (!rest) {
			return new BiscuitREST({
				...this.options.defaultRestOptions,
				token: this.options.token
			});
		}

		if (rest instanceof BiscuitREST || rest.cRest) {
			return rest;
		}

		throw new Error('[CORE] REST not found');
	}

	async start() {
		// alias fixed `this` on handlePayload
		const ctx = this as Session<true>;

		ctx.gateway = new GatewayManager({
			token: this.options.token,
			intents: this.options.intents ?? 0,
			connection: this.options.defaultGatewayOptions?.connection ?? (await this.rest.get('/gateway/bot')),
			async handlePayload(shard, data) {
				const { t, d } = data;
				if (!(t && d)) return;
				actionHandler([ctx, { t, d }, shard]);
			},
			...this.options.defaultGatewayOptions
		});

		await ctx.gateway.spawnShards();
	}
}

export type HandlePayload = Pick<CreateGatewayManagerOptions, 'handlePayload'>['handlePayload'];

export interface BiscuitOptions {
	token: string;
	intents: number | GatewayIntentBits;
	rest?: BiscuitREST;
	defaultRestOptions?: Partial<BiscuitRESTOptions>;
	defaultGatewayOptions?: Omit<CreateGatewayManagerOptions, 'token' | 'intents'>;
}
