import { CDN_URL } from '../common';
import type { APIRoutes, ApiHandler, CDNRoute } from './index';
import type { HttpMethods } from './shared';

export enum ProxyRequestMethod {
	Delete = 'delete',
	Get = 'get',
	Patch = 'patch',
	Post = 'post',
	Put = 'put',
}

const ArrRequestsMethods = Object.freeze(Object.values(ProxyRequestMethod)) as string[];

export class Router {
	noop = () => {
		return;
	};

	constructor(private rest: ApiHandler) {}

	createProxy(route = [] as string[]): APIRoutes {
		return new Proxy(this.noop, {
			get: (_, key: string) => {
				if (ArrRequestsMethods.includes(key)) {
					return (...options: any[]) =>
						this.rest.request(key.toUpperCase() as HttpMethods, `/${route.join('/')}`, ...options);
				}
				return this.createProxy([...route, key]);
			},
			apply: (...[, _, args]) => {
				return this.createProxy([...route, ...args]);
			},
		}) as unknown as APIRoutes;
	}
}

export const CDNRouter = {
	createProxy(route = [] as string[]): CDNRoute {
		const noop = () => {
			return;
		};
		return new Proxy(noop, {
			get: (_, key: string) => {
				if (key === 'get') {
					return (value?: string) => {
						const lastRoute = `${CDN_URL}/${route.join('/')}`;
						if (value) {
							if (typeof value !== 'string') {
								value = String(value);
							}
							return `${lastRoute}/${value}`;
						}
						return lastRoute;
					};
				}
				return this.createProxy([...route, key]);
			},
			apply: (...[, _, args]) => {
				return this.createProxy([...route, ...args]);
			},
		}) as unknown as CDNRoute;
	},
};
