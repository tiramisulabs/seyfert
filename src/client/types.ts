import type { HttpClient } from './httpclient';

export interface HttpServerAdapter {
	client: HttpClient;
	start?(path: `/${string}`): any;
}
