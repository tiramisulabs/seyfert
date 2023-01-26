import type { RestAdapater } from '@biscuitland/common';
import type { RestArguments } from './REST';

export interface Routes<CRA extends RestAdapater<any>> {
	guilds(id?: string): {
		channels: {
			get<T>(...args: RestArguments<CRA, 'get'>): Promise<T>;
			post<T>(...args: RestArguments<CRA, 'post'>): Promise<T>;
			patch<T>(...args: RestArguments<CRA, 'patch'>): Promise<T>;
		};
		members(id: string): {
			patch<T>(...args: RestArguments<CRA, 'patch'>): Promise<T>;
			delete<T>(...args: RestArguments<CRA, 'delete'>): Promise<T>;
			get<T>(...args: RestArguments<CRA, 'get'>): Promise<T>;
		};
		threads(): {
			active: {
				get<T>(...args: RestArguments<CRA, 'get'>): Promise<T>;
			};
		};
		bans(): {
			get<T>(...args: RestArguments<CRA, 'get'>): Promise<T>;
		};
		get<T>(...args: RestArguments<CRA, 'get'>): Promise<T>;
		patch<T>(...args: RestArguments<CRA, 'patch'>): Promise<T>;
		post<T>(...args: RestArguments<CRA, 'post'>): Promise<T>;
		delete<T>(...args: RestArguments<CRA, 'delete'>): Promise<T>;
	};
}

export interface Routes<CRA extends RestAdapater<any>> {
	channels(id: string): {
		get<T>(...args: RestArguments<CRA, 'get'>): Promise<T>;
	};
}

export interface Routes<CRA extends RestAdapater<any>> {
	users(id: string): {
		get<T>(...args: RestArguments<CRA, 'get'>): Promise<T>;
	};
}
