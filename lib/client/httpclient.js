"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpClient = void 0;
const v10_1 = require("discord-api-types/v10");
const magic_bytes_js_1 = require("magic-bytes.js");
const api_1 = require("../api");
const utils_1 = require("../api/utils/utils");
const common_1 = require("../common");
const base_1 = require("./base");
let UWS;
let nacl;
try {
    UWS = require('uWebSockets.js');
}
catch {
    // easter egg #1
}
try {
    nacl = require('tweetnacl');
}
catch {
    // I always cum
}
class HttpClient extends base_1.BaseClient {
    app;
    publicKey;
    publicKeyHex;
    constructor(options) {
        super(options);
        // if (!UWS) {
        // 	throw new Error('No uws installed.');
        // }
        if (!nacl) {
            throw new Error('No tweetnacl installed.');
        }
    }
    static readJson(res) {
        return new Promise((cb, err) => {
            let buffer;
            res.onData((ab, isLast) => {
                const chunk = Buffer.from(ab);
                if (isLast) {
                    let json;
                    try {
                        json = JSON.parse(buffer ? Buffer.concat([buffer, chunk]).toString() : chunk.toString());
                    }
                    catch (e) {
                        res.close();
                        return;
                    }
                    cb(json);
                }
                else {
                    buffer = Buffer.concat(buffer ? [buffer, chunk] : [chunk]);
                }
            });
            res.onAborted(err);
        });
    }
    async execute(options) {
        await super.execute();
        const { publicKey: publicKeyRC, port: portRC, applicationId: applicationIdRC, } = await this.getRC();
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
        }
        else {
            if (options.useUWS)
                return this.logger.warn('No uWebSockets installed.');
            this.logger.info('Use your preferred http server and invoke <HttpClient>.fetch(<Request>) to get started');
        }
    }
    async start(options = {}) {
        await super.start(options);
        return this.execute((0, common_1.MergeOptions)({ useUWS: true }, options.httpConnection));
    }
    async verifySignatureGenericRequest(req) {
        const timestamp = req.headers.get('x-signature-timestamp');
        const ed25519 = req.headers.get('x-signature-ed25519') ?? '';
        const body = (await req.json());
        if (nacl.sign.detached.verify(Buffer.from(timestamp + JSON.stringify(body)), Buffer.from(ed25519, 'hex'), this.publicKeyHex)) {
            return body;
        }
        return;
    }
    // https://discord.com/developers/docs/interactions/receiving-and-responding#security-and-authorization
    async verifySignature(res, req) {
        const timestamp = req.getHeader('x-signature-timestamp');
        const ed25519 = req.getHeader('x-signature-ed25519');
        const body = await HttpClient.readJson(res);
        if (nacl.sign.detached.verify(Buffer.from(timestamp + JSON.stringify(body)), Buffer.from(ed25519, 'hex'), this.publicKeyHex)) {
            return body;
        }
        return;
    }
    async fetch(req) {
        const rawBody = await this.verifySignatureGenericRequest(req);
        if (!rawBody) {
            this.debugger?.debug('Invalid request/No info, returning 418 status.');
            // I'm a teapot
            return new Response('', { status: 418 });
        }
        switch (rawBody.type) {
            case v10_1.InteractionType.Ping:
                this.debugger?.debug('Ping interaction received, responding.');
                return Response.json({ type: v10_1.InteractionResponseType.Pong }, {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
            default:
                return new Promise(r => {
                    if ((0, common_1.isCloudfareWorker)())
                        return this.handleCommand
                            .interaction(rawBody, -1)
                            .then(() => r(new Response()))
                            .catch(() => r(new Response()));
                    return this.handleCommand.interaction(rawBody, -1, async ({ body, files }) => {
                        let response;
                        const headers = {};
                        if (files) {
                            response = new FormData();
                            for (const [index, file] of files.entries()) {
                                const fileKey = file.key ?? `files[${index}]`;
                                if ((0, utils_1.isBufferLike)(file.data)) {
                                    let contentType = file.contentType;
                                    if (!contentType) {
                                        const [parsedType] = (0, magic_bytes_js_1.filetypeinfo)(file.data);
                                        if (parsedType) {
                                            contentType =
                                                api_1.OverwrittenMimeTypes[parsedType.mime] ??
                                                    parsedType.mime ??
                                                    'application/octet-stream';
                                        }
                                    }
                                    response.append(fileKey, new Blob([file.data], { type: contentType }), file.name);
                                }
                                else {
                                    response.append(fileKey, new Blob([`${file.data}`], { type: file.contentType }), file.name);
                                }
                            }
                            if (body) {
                                response.append('payload_json', JSON.stringify(body));
                            }
                        }
                        else {
                            response = body ?? {};
                            headers['Content-Type'] = 'application/json';
                        }
                        r(response instanceof FormData
                            ? new Response(response, { headers })
                            : Response.json(response, {
                                headers,
                            }));
                    });
                });
        }
    }
    async onPacket(res, req) {
        const rawBody = await this.verifySignature(res, req);
        if (rawBody) {
            switch (rawBody.type) {
                case v10_1.InteractionType.Ping:
                    this.debugger?.debug('Ping interaction received, responding.');
                    res
                        .writeHeader('Content-Type', 'application/json')
                        .end(JSON.stringify({ type: v10_1.InteractionResponseType.Pong }));
                    break;
                default:
                    await this.handleCommand.interaction(rawBody, -1, async ({ body, files }) => {
                        res.cork(() => {
                            let response;
                            const headers = {};
                            if (files) {
                                response = new FormData();
                                for (const [index, file] of files.entries()) {
                                    const fileKey = file.key ?? `files[${index}]`;
                                    if ((0, utils_1.isBufferLike)(file.data)) {
                                        let contentType = file.contentType;
                                        if (!contentType) {
                                            const [parsedType] = (0, magic_bytes_js_1.filetypeinfo)(file.data);
                                            if (parsedType) {
                                                contentType =
                                                    api_1.OverwrittenMimeTypes[parsedType.mime] ??
                                                        parsedType.mime ??
                                                        'application/octet-stream';
                                            }
                                        }
                                        response.append(fileKey, new Blob([file.data], { type: contentType }), file.name);
                                    }
                                    else {
                                        response.append(fileKey, new Blob([`${file.data}`], { type: file.contentType }), file.name);
                                    }
                                }
                                if (body) {
                                    response.append('payload_json', JSON.stringify(body));
                                }
                            }
                            else {
                                response = body ?? {};
                                headers['Content-Type'] = 'application/json';
                            }
                            for (const i in headers) {
                                res.writeHeader(i, headers[i]);
                            }
                            return res.end(JSON.stringify(response));
                        });
                    });
                    break;
            }
        }
        else {
            this.debugger?.debug('Invalid request/No info, returning 418 status.');
            // I'm a teapot
            res.writeStatus('418').end();
        }
    }
}
exports.HttpClient = HttpClient;
