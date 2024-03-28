import { type APIInteraction, InteractionResponseType, InteractionType } from 'discord-api-types/v10';
import { filetypeinfo } from 'magic-bytes.js';
import type { HttpRequest, HttpResponse } from 'uWebSockets.js';
import { OverwrittenMimeTypes } from '../api';
import { isBufferLike } from '../api/utils/utils';
import type { DeepPartial } from '../common';
import type { BaseClientOptions, InternalRuntimeConfigHTTP, StartOptions } from './base';
import { BaseClient } from './base';
import { onInteractionCreate } from './oninteractioncreate';

let UWS: typeof import('uWebSockets.js') | undefined;
let nacl: typeof import('tweetnacl') | undefined;

try {
	UWS = require('uWebSockets.js');
} catch {
	// easter egg #1
}

try {
	nacl = require('tweetnacl');
} catch {
	// I always cum
}

export class HttpClient extends BaseClient {
	app!: ReturnType<typeof import('uWebSockets.js').App>;
	publicKey!: string;
	publicKeyHex!: Buffer;

	constructor(options?: BaseClientOptions) {
		super(options);
		if (!UWS) {
			throw new Error('No uws installed.');
		}
		if (!nacl) {
			throw new Error('No tweetnacl installed.');
		}
	}

	protected static readJson<T extends Record<string, any>>(res: HttpResponse) {
		return new Promise<T>((cb, err) => {
			let buffer: Buffer | undefined;
			res.onData((ab, isLast) => {
				const chunk = Buffer.from(ab);
				if (isLast) {
					let json;
					try {
						json = JSON.parse(buffer ? Buffer.concat([buffer, chunk]).toString() : chunk.toString());
					} catch (e) {
						res.close();
						return;
					}
					cb(json);
				} else {
					buffer = Buffer.concat(buffer ? [buffer, chunk] : [chunk]);
				}
			});

			res.onAborted(err);
		});
	}

	protected async execute(options?: { publicKey?: string; port?: number }) {
		await super.execute();
		const {
			publicKey: publicKeyRC,
			port: portRC,
			applicationId: applicationIdRC,
		} = await this.getRC<InternalRuntimeConfigHTTP>();

		const publicKey = options?.publicKey ?? publicKeyRC;
		const port = options?.port ?? portRC;

		if (!publicKey) {
			throw new Error('Expected a publicKey, check your config file');
		}
		if (!port) {
			throw new Error('Expected a port, check your config file');
		}
		if (applicationIdRC) {
			this.applicationId = applicationIdRC;
		}

		this.publicKey = publicKey;
		this.publicKeyHex = Buffer.from(this.publicKey, 'hex');
		this.app = UWS!.App();
		this.app.post('/interactions', (res, req) => {
			return this.onPacket(res, req);
		});
		this.app.listen(port, () => {
			this.logger.info(`Listening to port ${port}`);
		});
	}

	async start(options: DeepPartial<Omit<StartOptions, 'connection'>> = {}) {
		await super.start(options);
		return this.execute(options.httpConnection);
	}

	// https://discord.com/developers/docs/interactions/receiving-and-responding#security-and-authorization
	protected async verifySignature(res: HttpResponse, req: HttpRequest) {
		const timestamp = req.getHeader('x-signature-timestamp');
		const ed25519 = req.getHeader('x-signature-ed25519');
		const body = await HttpClient.readJson<APIInteraction>(res);
		if (
			nacl!.sign.detached.verify(
				Buffer.from(timestamp + JSON.stringify(body)),
				Buffer.from(ed25519, 'hex'),
				this.publicKeyHex,
			)
		) {
			return body;
		}
		return;
	}

	async onPacket(res: HttpResponse, req: HttpRequest) {
		const rawBody = await this.verifySignature(res, req);
		if (!rawBody) {
			this.debugger?.debug('Invalid request/No info, returning 418 status.');
			// I'm a teapot
			res.writeStatus('418').end();
		} else {
			switch (rawBody.type) {
				case InteractionType.Ping:
					this.debugger?.debug('Ping interaction received, responding.');
					res
						.writeHeader('Content-Type', 'application/json')
						.end(JSON.stringify({ type: InteractionResponseType.Pong }));
					break;
				default:
					await onInteractionCreate(this, rawBody, -1, async ({ body, files }) => {
						let response;
						const headers: { 'Content-Type'?: string } = {};

						if (files) {
							response = new FormData();
							for (const [index, file] of files.entries()) {
								const fileKey = file.key ?? `files[${index}]`;
								if (isBufferLike(file.data)) {
									let contentType = file.contentType;

									if (!contentType) {
										const [parsedType] = filetypeinfo(file.data);

										if (parsedType) {
											contentType =
												OverwrittenMimeTypes[parsedType.mime as keyof typeof OverwrittenMimeTypes] ??
												parsedType.mime ??
												'application/octet-stream';
										}
									}
									response.append(fileKey, new Blob([file.data], { type: contentType }), file.name);
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

						for (const i in headers) {
							res.writeHeader(i, headers[i as keyof typeof headers]!);
						}

						return res.end(JSON.stringify(response));
					});
					break;
			}
		}
	}
}
