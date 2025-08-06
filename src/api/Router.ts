import { CDN_URL } from '../common';
import type { APIRoutes, ApiHandler, CDNRoute } from './index';
import type {
	HttpMethods,
	ImageExtension,
	ImageSize,
	SoundExtension,
	StickerExtension,
	TagBadgeExtension,
} from './shared';

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
					return (value: string | number | CDNUrlOptions | undefined, options?: CDNUrlOptions) => {
						const lastRoute = `${CDN_URL}/${route.join('/')}`;
						if (typeof value === 'string' || typeof value === 'number') {
							return parseCDNURL(`${lastRoute}/${value}`, options);
						}
						return parseCDNURL(lastRoute, value);
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

export type AllCDNExtensions = ImageExtension | StickerExtension | SoundExtension | TagBadgeExtension;

export interface BaseCDNUrlOptions<T extends AllCDNExtensions = AllCDNExtensions> {
	extension?: T;
	size?: ImageSize;
}

export interface CDNUrlOptions extends BaseCDNUrlOptions {
	forceStatic?: boolean;
}

export function parseCDNURL(route: string, options: CDNUrlOptions = {}) {
	if (options.forceStatic && route.includes('a_')) options.extension = 'png';
	if (!options.extension && route.includes('a_')) options.extension = 'gif';

	options.extension ||= route.includes('soundboard') ? 'ogg' : 'png';

	const url = new URL(`${route}.${options.extension}`);

	if (options.size) url.searchParams.set('size', `${options.size}`);

	return url.toString();
}
