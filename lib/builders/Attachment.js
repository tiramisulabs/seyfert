"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttachmentBuilder = exports.Attachment = void 0;
exports.resolveAttachment = resolveAttachment;
exports.resolveFiles = resolveFiles;
exports.resolveAttachmentData = resolveAttachmentData;
exports.resolveBase64 = resolveBase64;
exports.resolveImage = resolveImage;
const node_crypto_1 = require("node:crypto");
const node_path_1 = __importDefault(require("node:path"));
const __1 = require("..");
const Base_1 = require("../structures/extra/Base");
const node_fs_1 = require("node:fs");
class Attachment extends Base_1.Base {
    data;
    constructor(client, data) {
        super(client);
        this.data = data;
        this.__patchThis(data);
    }
}
exports.Attachment = Attachment;
class AttachmentBuilder {
    data;
    /**
     * Creates a new Attachment instance.
     * @param data - The partial attachment data.
     */
    constructor(data = { name: `${((0, node_crypto_1.randomBytes)?.(8))?.toString('base64url') || 'default'}.jpg` }) {
        this.data = data;
    }
    /**
     * Sets the name of the attachment.
     * @param name - The name of the attachment.
     * @returns The Attachment instance.
     * @example
     * attachment.setName('example.jpg');
     */
    setName(name) {
        this.data.name = name;
        return this;
    }
    /**
     * Sets the description of the attachment.
     * @param desc - The description of the attachment.
     * @returns The Attachment instance.
     * @example
     * attachment.setDescription('This is an example attachment');
     */
    setDescription(desc) {
        this.data.description = desc;
        return this;
    }
    /**
     * Sets the file data of the attachment.
     * @param type - The type of the attachment data.
     * @param data - The resolvable data of the attachment.
     * @returns The Attachment instance.
     * @example
     * attachment.setFile('url', 'https://example.com/example.jpg');
     * attachment.setFile('path', '../assets/example.jpg');
     * attachment.setFile('buffer', Buffer.from(image.decode()));
     */
    setFile(type, data) {
        this.data.type = type;
        this.data.resolvable = data;
        return this;
    }
    /**
     * Sets whether the attachment is a spoiler.
     * @param spoiler - Whether the attachment is a spoiler.
     * @returns The Attachment instance.
     * @example
     * attachment.setSpoiler(true);
     */
    setSpoiler(spoiler) {
        if (spoiler === this.spoiler)
            return this;
        if (!spoiler) {
            this.data.name = this.data.name.slice('SPOILER_'.length);
            return this;
        }
        this.data.name = `SPOILER_${this.data.name}`;
        return this;
    }
    /**
     * Gets whether the attachment is a spoiler.
     */
    get spoiler() {
        return this.data.name?.startsWith('SPOILER_') ?? false;
    }
    /**
     * Converts the Attachment instance to JSON.
     * @returns The JSON representation of the Attachment instance.
     */
    toJSON() {
        return this.data;
    }
}
exports.AttachmentBuilder = AttachmentBuilder;
/**
 * Resolves an attachment to a REST API attachment.
 * @param resolve - The attachment or attachment data to resolve.
 * @returns The resolved REST API attachment.
 */
function resolveAttachment(resolve) {
    if ('id' in resolve)
        return resolve;
    if (resolve instanceof AttachmentBuilder) {
        const data = resolve.toJSON();
        return { filename: data.name, description: data.description };
    }
    return { filename: resolve.name, description: resolve.description };
}
/**
 * Resolves a list of attachments to raw files.
 * @param resources - The list of attachments to resolve.
 * @returns The resolved raw files.
 */
async function resolveFiles(resources) {
    const data = await Promise.all(resources.map(async (resource, i) => {
        if (resource instanceof AttachmentBuilder) {
            const { type, resolvable, name } = resource.toJSON();
            const resolve = await resolveAttachmentData(resolvable, type);
            return { ...resolve, key: `files[${i}]`, name };
        }
        if (resource instanceof Attachment) {
            const resolve = await resolveAttachmentData(resource.url, 'url');
            return {
                data: resolve.data,
                contentType: resolve.contentType,
                key: `files[${i}]`,
                name: resource.filename,
            };
        }
        return {
            data: resource.data,
            contentType: resource.contentType,
            key: `files[${i}]`,
            name: resource.name,
        };
    }));
    return data;
}
/**
 * Resolves the data of an attachment.
 * @param data - The resolvable data of the attachment.
 * @param type - The type of the attachment data.
 * @returns The resolved attachment data.
 */
async function resolveAttachmentData(data, type) {
    if (data instanceof AttachmentBuilder) {
        if (!data.data.resolvable)
            return (0, __1.throwError)('The attachment type has been expressed as attachment but cannot be resolved as one.');
        return { data: data.data.resolvable };
    }
    switch (type) {
        case 'url': {
            if (!/^https?:\/\//.test(data))
                return (0, __1.throwError)(`The attachment type has been expressed as ${type.toUpperCase()} but cannot be resolved as one.`);
            const res = await fetch(data);
            return { data: Buffer.from(await res.arrayBuffer()), contentType: res.headers.get('content-type') };
        }
        case 'path': {
            const file = node_path_1.default.resolve(data);
            const stats = await node_fs_1.promises.stat(file);
            if (!stats.isFile())
                return (0, __1.throwError)(`The attachment type has been expressed as ${type.toUpperCase()} but cannot be resolved as one.`);
            return { data: await node_fs_1.promises.readFile(file) };
        }
        case 'buffer': {
            if (Buffer.isBuffer(data))
                return { data };
            // @ts-expect-error
            if (typeof data[Symbol.asyncIterator] === 'function') {
                const buffers = [];
                for await (const resource of data)
                    buffers.push(Buffer.from(resource));
                return { data: Buffer.concat(buffers) };
            }
            return (0, __1.throwError)(`The attachment type has been expressed as ${type.toUpperCase()} but cannot be resolved as one.`);
        }
        default: {
            return (0, __1.throwError)(`The attachment type has been expressed as ${type} but cannot be resolved as one.`);
        }
    }
}
/**
 * Resolves a base64 data to a data URL.
 * @param data - The base64 data.
 * @returns The resolved data URL.
 */
function resolveBase64(data) {
    if (Buffer.isBuffer(data))
        return `data:image/jpg;base64,${data.toString('base64')}`;
    return data;
}
/**
 * Resolves an image to a base64 data URL.
 * @param image - The image to resolve.
 * @returns The resolved base64 data URL.
 */
async function resolveImage(image) {
    if (image instanceof AttachmentBuilder) {
        const { data: { type, resolvable }, } = image;
        if (type && resolvable)
            return resolveBase64((await resolveAttachmentData(resolvable, type)).data);
        return (0, __1.throwError)(`The attachment type has been expressed as ${(type ?? 'Attachment').toUpperCase()} but cannot be resolved as one.`);
    }
    if (image instanceof Attachment) {
        const response = await fetch(image.url);
        return resolveBase64((await resolveAttachmentData(await response.arrayBuffer(), 'buffer')).data);
    }
    const file = await resolveAttachmentData(image.data, image.type);
    return resolveBase64(file.data);
}
