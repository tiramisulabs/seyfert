import { Router } from '../../api';
import type { UsingClient } from '../../commands';
import { toCamelCase } from '../../common';

/** */
export abstract class Base {
	constructor(client: UsingClient) {
		Object.assign(this, { client });
	}

	/**@internal */
	get rest() {
		return this.client.rest;
	}

	/**@internal */
	get cache() {
		return this.client.cache;
	}

	/**@internal */
	get api() {
		const rest = this.rest;
		return Router.prototype.createProxy.call({
			rest,
			noop: () => {
				return;
			},
			createProxy(route?: string[]) {
				return Router.prototype.createProxy.call({ ...this, rest }, route);
			},
		});
	}

	/**@internal */
	protected __patchThis(data: Record<string, any>) {
		Object.assign(this, toCamelCase(data));
		return this;
	}

	readonly client!: UsingClient;
}
