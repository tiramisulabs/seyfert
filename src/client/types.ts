import type { UsingClient } from '../commands';

export interface HttpServerAdapter {
	client: UsingClient;
	start?(path: `/${string}`): any;
}
