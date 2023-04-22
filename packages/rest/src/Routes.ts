import type { BiscuitREST, RestArguments } from './REST';

export interface Routes<CRA extends BiscuitREST> {
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
		roles(id?: string): {
			get<T>(...args: RestArguments<CRA, 'get'>): Promise<T>;
			post<T>(...args: RestArguments<CRA, 'post'>): Promise<T>;
			patch<T>(...args: RestArguments<CRA, 'patch'>): Promise<T>;
			delete<T>(...args: RestArguments<CRA, 'delete'>): Promise<T>;
		};
		bans(userId?: string): {
			get<T>(...args: RestArguments<CRA, 'get'>): Promise<T>;
			put<T>(...args: RestArguments<CRA, 'put'>): Promise<T>;
			delete<T>(...args: RestArguments<CRA, 'delete'>): Promise<T>;
		};
		mfa(level: number): {
			post<T>(...args: RestArguments<CRA, 'post'>): Promise<T>;
		};
		prune: {
			get<T>(...args: RestArguments<CRA, 'get'>): Promise<T>;
			post<T>(...args: RestArguments<CRA, 'post'>): Promise<T>;
		};
		regions: {
			get<T>(...args: RestArguments<CRA, 'get'>): Promise<T>;
		};
		invites: {
			get<T>(...args: RestArguments<CRA, 'get'>): Promise<T>;
		};
		widget: {
			get<T>(...args: RestArguments<CRA, 'get'>): Promise<T>;
			patch<T>(...args: RestArguments<CRA, 'patch'>): Promise<T>;
		};
		integrations(id?: string): {
			get<T>(...args: RestArguments<CRA, 'get'>): Promise<T>;
			delete<T>(...args: RestArguments<CRA, 'delete'>): Promise<T>;
		};
		'vanity-url': {
			get<T>(...args: RestArguments<CRA, 'get'>): Promise<T>;
		};
		'welcome-screen': {
			get<T>(...args: RestArguments<CRA, 'get'>): Promise<T>;
			patch<T>(...args: RestArguments<CRA, 'patch'>): Promise<T>;
		};
		get<T>(...args: RestArguments<CRA, 'get'>): Promise<T>;
		patch<T>(...args: RestArguments<CRA, 'patch'>): Promise<T>;
		post<T>(...args: RestArguments<CRA, 'post'>): Promise<T>;
		delete<T>(...args: RestArguments<CRA, 'delete'>): Promise<T>;
	};
}

export interface Routes<CRA extends BiscuitREST> {
	channels(id: string): {
		typing: {
			post<T>(...args: RestArguments<CRA, 'post'>): Promise<T>;
		};
		get<T>(...args: RestArguments<CRA, 'get'>): Promise<T>;
		patch<T>(...args: RestArguments<CRA, 'patch'>): Promise<T>;
		delete<T>(...args: RestArguments<CRA, 'delete'>): Promise<T>;
		webhooks: {
			get<T>(...args: RestArguments<CRA, 'get'>): Promise<T>;
		};
		messages(id?: string): {
			get<T>(...args: RestArguments<CRA, 'get'>): Promise<T>;
			post<T>(...args: RestArguments<CRA, 'post'>): Promise<T>;
		};
	};
}

export interface Routes<CRA extends BiscuitREST> {
	users(id: string): {
		get<T>(...args: RestArguments<CRA, 'get'>): Promise<T>;
	};
}
