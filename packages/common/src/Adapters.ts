export interface RestAdapater<AdapterOptions> {
	options?: AdapterOptions;
	cRest: any;
	get<T>(route: string, data?: unknown, options?: any): Promise<T>;

	post<T>(route: string, data?: unknown, options?: any): Promise<T>;

	put<T>(route: string, data?: unknown, options?: any): Promise<T>;

	delete<T>(route: string, data?: unknown, options?: any): Promise<T>;

	patch<T>(route: string, data?: unknown, options?: any): Promise<T>;

	setToken(token?: string): this;
}
