import {
	type APIInteractionResponse,
	InteractionResponseType,
	InteractionType,
	type APIInteraction,
} from 'discord-api-types/v10';
import { filetypeinfo } from 'magic-bytes.js';
import type { HttpRequest, HttpResponse } from 'uWebSockets.js';
import { OverwrittenMimeTypes } from '../api';
import { isBufferLike } from '../api/utils/utils';
import { MergeOptions, isCloudfareWorker, type DeepPartial } from '../common';
import type { BaseClientOptions, InternalRuntimeConfigHTTP, StartOptions } from './base';
import { BaseClient } from './base';

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
	app?: ReturnType<typeof import('uWebSockets.js').App>;
	publicKey!: string;
	publicKeyHex!: Buffer;

	constructor(options?: BaseClientOptions) {
		super(options);
		// if (!UWS) {
		// 	throw new Error('No uws installed.');
		// }
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

	protected async execute(options: DeepPartial<StartOptions['httpConnection']>) {
		await super.execute();
		const {
			publicKey: publicKeyRC,
			port: portRC,
			applicationId: applicationIdRC,
		} = await this.getRC<InternalRuntimeConfigHTTP>();

		const publicKey = options.publicKey ?? publicKeyRC;
		const port = options.port ?? portRC;

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
		if (UWS && options.useUWS) {
			this.app = UWS.App();
			this.app.post('/interactions', (res, req) => {
				return this.onPacket(res, req);
			});
			this.app.listen(port, () => {
				this.logger.info(`Listening to <url>:${port}/interactions`);
			});
		} else {
			if (options.useUWS) return this.logger.warn('No uWebSockets installed.');
			this.logger.info('Use your preferred http server and invoke <HttpClient>.fetch(<Request>) to get started');
		}
	}

	async start(options: DeepPartial<Omit<StartOptions, 'connection' | 'eventsDir'>> = {}) {
		await super.start(options);
		return this.execute(
			MergeOptions<DeepPartial<StartOptions['httpConnection']>>({ useUWS: true }, options.httpConnection),
		);
	}

	protected async verifySignatureGenericRequest(req: Request) {
		const timestamp = req.headers.get('x-signature-timestamp');
		const ed25519 = req.headers.get('x-signature-ed25519') ?? '';
		const body = (await req.json()) as APIInteraction;
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

	async fetch(req: Request): Promise<Response> {
		const rawBody = await this.verifySignatureGenericRequest(req);
		if (!rawBody) {
			this.debugger?.debug('Invalid request/No info, returning 418 status.');
			// I'm a teapot
			return new Response('', { status: 418 });
		}
		switch (rawBody.type) {
			case InteractionType.Ping:
				this.debugger?.debug('Ping interaction received, responding.');
				return Response.json(
					{ type: InteractionResponseType.Pong },
					{
						headers: {
							'Content-Type': 'application/json',
						},
					},
				);
			default:
				return new Promise<Response>(r => {
					if (isCloudfareWorker())
						return this.handleCommand
							.interaction(rawBody, -1)
							.then(() => r(new Response()))
							.catch(() => r(new Response()));
					return this.handleCommand.interaction(rawBody, -1, async ({ body, files }) => {
						let response: FormData | APIInteractionResponse;
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

						r(
							response instanceof FormData
								? new Response(response, { headers })
								: Response.json(response, {
										headers,
									}),
						);
					});
				});
		}
	}

	protected async onPacket(res: HttpResponse, req: HttpRequest) {
		const rawBody = await this.verifySignature(res, req);
		if (rawBody) {
			switch (rawBody.type) {
				case InteractionType.Ping:
					this.debugger?.debug('Ping interaction received, responding.');
					res
						.writeHeader('Content-Type', 'application/json')
						.end(JSON.stringify({ type: InteractionResponseType.Pong }));
					break;
				default:
					await this.handleCommand.interaction(rawBody, -1, async ({ body, files }) => {
						res.cork(() => {
							let response: FormData | APIInteractionResponse;
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
					});
					break;
			}
		} else {
			this.debugger?.debug('Invalid request/No info, returning 418 status.');
			// I'm a teapot
			res.writeStatus('418').end();
		}
	}
}
