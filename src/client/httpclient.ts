import type { DeepPartial } from '../common';
import type { BaseClientOptions, StartOptions } from './base';
import { BaseClient, clientInitialization, coalesceClientStart } from './base';
import type { RegisteredPluginExtension } from './plugins';

export class HttpClient extends BaseClient {
	constructor(options?: BaseClientOptions) {
		super(options);
	}

	start(options: DeepPartial<Omit<StartOptions, 'connection' | 'eventsDir'>> = {}) {
		return this[coalesceClientStart](async () => {
			await this[clientInitialization](options);
			return this.execute(options.httpConnection);
		});
	}
}

export interface HttpClient extends RegisteredPluginExtension {}
