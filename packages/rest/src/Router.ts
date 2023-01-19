import type { RestAdapater } from '@biscuitland/common';
import type { Routes } from './Routes';

export enum RequestMethod {
	Delete = 'delete',
	Get = 'get',
	Patch = 'patch',
	Post = 'post',
	Put = 'put',
}

export class Router<CustomRestAdapter extends RestAdapater<any>> {
	noop = () => {
		return;
	};

	constructor(public rest: CustomRestAdapter) {}

	createProxy<T extends CustomRestAdapter>(
		route = [] as string[]
	): Routes<T> {
		return new Proxy(this.noop, {
			get: (_, key: string) => {
				if (RequestMethod[key]) {
					return (...options: any[]) =>
						this.rest[key](route, ...options);
				}
				route.push(key);
				return this.createProxy<T>(route);
			},
			apply: (...[, _, args]) => {
				route.push(...args.filter(x => x != null));
				return this.createProxy<T>(route);
			},
		}) as unknown as Routes<T>;
	}
}
