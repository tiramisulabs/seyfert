import type { RestAdapater } from '@biscuitland/common';
import type { RestArguments } from './REST';

export interface Routes<CRA extends RestAdapater<any>> {
	guilds(id: string): {
		channels: {
			get<T>(...args: RestArguments<CRA, 'get'>): Promise<T>;
		};
	};
}

export interface Routes<CRA extends RestAdapater<any>> {
	channels(id: string): {
		get<T>(...args: RestArguments<CRA, 'get'>): Promise<T>;
	};
}
