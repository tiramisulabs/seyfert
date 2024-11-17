import type { UsingClient } from '../commands';
import type { Awaitable } from '../common';

export interface HttpServerAdapter {
	client: UsingClient;
	start?(path: `/${string}`): Awaitable<unknown>;
}
