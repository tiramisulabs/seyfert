import type { DeepPartial } from '../common';
import type { BaseClientOptions, StartOptions } from './base';
import { BaseClient } from './base';
import type { RegisteredPluginExtension } from './plugins';

export class HttpClient extends BaseClient {
	constructor(options?: BaseClientOptions) {
		super(options);
	}

	async start(options: DeepPartial<Omit<StartOptions, 'connection' | 'eventsDir'>> = {}) {
		await super.start(options);
		return this.execute(options.httpConnection);
	}
}

export interface HttpClient extends RegisteredPluginExtension {}
