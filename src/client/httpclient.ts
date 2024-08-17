import type { APIInteractionResponse, APIInteraction } from '../types';
import { isBufferLike } from '../api/utils/utils';
import type { DeepPartial } from '../common';
import type { BaseClientOptions, StartOptions } from './base';
import { BaseClient } from './base';

export class HttpClient extends BaseClient {
	constructor(options?: BaseClientOptions) {
		super(options);
	}

	async start(options: DeepPartial<Omit<StartOptions, 'connection' | 'eventsDir'>> = {}) {
		await super.start(options);
		return this.execute(options.httpConnection ?? {});
	}

	async onPacket(rawBody: APIInteraction): Promise<{
		headers: { 'Content-Type'?: string };
		response: APIInteractionResponse | FormData;
	}> {
		return new Promise(async r => {
			await this.handleCommand.interaction(rawBody, -1, async ({ body, files }) => {
				let response: FormData | APIInteractionResponse;
				const headers: { 'Content-Type'?: string } = {};

				if (files) {
					response = new FormData();
					for (const [index, file] of files.entries()) {
						const fileKey = file.key ?? `files[${index}]`;
						if (isBufferLike(file.data)) {
							response.append(fileKey, new Blob([file.data], { type: file.contentType }), file.name);
						} else {
							response.append(fileKey, new Blob([`${file.data}`], { type: file.contentType }), file.name);
						}
					}
					if (body) {
						response.append('payload_json', JSON.stringify(body));
					}
				} else {
					response = body ?? {};
					headers['Content-Type'] = 'application/json';
				}

				return r({
					headers,
					response,
				});
			});
		});
	}
}
