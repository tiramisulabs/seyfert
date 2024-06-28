import { type APIInteraction } from 'discord-api-types/v10';
import type { HttpRequest, HttpResponse } from 'uWebSockets.js';
import { type DeepPartial } from '../common';
import type { BaseClientOptions, StartOptions } from './base';
import { BaseClient } from './base';
export declare class HttpClient extends BaseClient {
    app?: ReturnType<typeof import('uWebSockets.js').App>;
    publicKey: string;
    publicKeyHex: Buffer;
    constructor(options?: BaseClientOptions);
    protected static readJson<T extends Record<string, any>>(res: HttpResponse): Promise<T>;
    protected execute(options: DeepPartial<StartOptions['httpConnection']>): Promise<void>;
    start(options?: DeepPartial<Omit<StartOptions, 'connection' | 'eventsDir'>>): Promise<void>;
    protected verifySignatureGenericRequest(req: Request): Promise<APIInteraction | undefined>;
    protected verifySignature(res: HttpResponse, req: HttpRequest): Promise<APIInteraction | undefined>;
    fetch(req: Request): Promise<Response>;
    protected onPacket(res: HttpResponse, req: HttpRequest): Promise<void>;
}
