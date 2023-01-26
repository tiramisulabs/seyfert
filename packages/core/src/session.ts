import type { CDNRoutes, Routes } from '@biscuitland/rest';
import { CDN, BiscuitREST, Router } from '@biscuitland/rest';
import type { RestAdapater } from '@biscuitland/common';
import { EventEmitter2 } from 'eventemitter2';
import { Utils } from '.';
import { MainManager } from './structures/managers/MainManager';

export class Session<
	RA extends RestAdapater<any> = BiscuitREST,
> extends EventEmitter2 {
	constructor(public token: string, rest?: RA) {
		super();
		this.rest = rest ?? new BiscuitREST({});
		this.api = new Router(this.rest).createProxy();
		this.cdn = CDN.createProxy();
		this.managers = new MainManager(this);
	}

	utils = Utils;
	rest: RA | BiscuitREST;
	api: Routes<RA | BiscuitREST>;
	cdn: CDNRoutes;
	managers: MainManager;
}
