import type { APIAttachment, RESTAPIAttachment } from 'discord-api-types/v10';
import { randomBytes } from 'node:crypto';
import path from 'node:path';
import { type UsingClient, throwError, type RawFile } from '..';
import type { ImageResolvable, ObjectToLower } from '../common';
import { Base } from '../structures/extra/Base';
import { promises } from 'node:fs';

export interface AttachmentResolvableMap {
	url: string;
	buffer: Buffer | ArrayBuffer;
	path: string;
}
export type AttachmentResolvable =
	| AttachmentResolvableMap[keyof AttachmentResolvableMap]
	| AttachmentBuilder
	| Attachment;
export type AttachmentDataType = keyof AttachmentResolvableMap;
export interface AttachmentData {
	name: string;
	description: string;
	resolvable: AttachmentResolvable;
	type: AttachmentDataType;
}

export interface Attachment extends ObjectToLower<APIAttachment> {}
export class Attachment extends Base {
	constructor(
		client: UsingClient,
		public data: APIAttachment,
	) {
		super(client);
		this.__patchThis(data);
	}
}

export class AttachmentBuilder {
	/**
	 * Creates a new Attachment instance.
	 * @param data - The partial attachment data.
	 */
	constructor(
		public data: Partial<AttachmentData> = { name: `${randomBytes?.(8)?.toString('base64url') || 'default'}.jpg` },
	) {}

	/**
	 * Sets the name of the attachment.
	 * @param name - The name of the attachment.
	 * @returns The Attachment instance.
	 * @example
	 * attachment.setName('example.jpg');
	 */
	setName(name: string): this {
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
	setDescription(desc: string): this {
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
	setFile<T extends AttachmentDataType = AttachmentDataType>(type: T, data: AttachmentResolvableMap[T]): this {
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
	setSpoiler(spoiler: boolean): this {
		if (spoiler === this.spoiler) return this;
		if (!spoiler) {
			this.data.name = this.data.name!.slice('SPOILER_'.length);
			return this;
		}
		this.data.name = `SPOILER_${this.data.name}`;
		return this;
	}

	/**
	 * Gets whether the attachment is a spoiler.
	 */
	get spoiler(): boolean {
		return this.data.name?.startsWith('SPOILER_') ?? false;
	}

	/**
	 * Converts the Attachment instance to JSON.
	 * @returns The JSON representation of the Attachment instance.
	 */
	toJSON(): AttachmentData {
		return this.data as AttachmentData;
	}
}

/**
 * Resolves an attachment to a REST API attachment.
 * @param resolve - The attachment or attachment data to resolve.
 * @returns The resolved REST API attachment.
 */
export function resolveAttachment(
	resolve: Attachment | AttachmentData | RESTAPIAttachment,
): Omit<RESTAPIAttachment, 'id'> {
	if ('id' in resolve) return resolve;

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
export async function resolveFiles(resources: (AttachmentBuilder | RawFile | Attachment)[]): Promise<RawFile[]> {
	const data = await Promise.all(
		resources.map(async (resource, i) => {
			if (resource instanceof AttachmentBuilder) {
				const { type, resolvable, name } = resource.toJSON();
				const resolve = await resolveAttachmentData(resolvable, type);
				return { ...resolve, key: `files[${i}]`, name } as RawFile;
			}
			if (resource instanceof Attachment) {
				const resolve = await resolveAttachmentData(resource.url, 'url');
				return {
					data: resolve.data,
					contentType: resolve.contentType,
					key: `files[${i}]`,
					name: resource.filename,
				} as RawFile;
			}
			return {
				data: resource.data,
				contentType: resource.contentType,
				key: `files[${i}]`,
				name: resource.name,
			} as RawFile;
		}),
	);

	return data;
}

/**
 * Resolves the data of an attachment.
 * @param data - The resolvable data of the attachment.
 * @param type - The type of the attachment data.
 * @returns The resolved attachment data.
 */
export async function resolveAttachmentData(
	data: AttachmentResolvable,
	type: AttachmentDataType,
): Promise<{
	data: AttachmentResolvable;
	contentType?: string | null;
}> {
	if (data instanceof AttachmentBuilder) {
		if (!data.data.resolvable)
			return throwError('The attachment type has been expressed as attachment but cannot be resolved as one.');
		return { data: data.data.resolvable! };
	}

	switch (type) {
		case 'url': {
			if (!/^https?:\/\//.test(data as string))
				return throwError(
					`The attachment type has been expressed as ${type.toUpperCase()} but cannot be resolved as one.`,
				);
			const res = await fetch(data as string);
			return { data: Buffer.from(await res.arrayBuffer()), contentType: res.headers.get('content-type') };
		}
		case 'path': {
			const file = path.resolve(data as string);
			const stats = await promises.stat(file);
			if (!stats.isFile())
				return throwError(
					`The attachment type has been expressed as ${type.toUpperCase()} but cannot be resolved as one.`,
				);
			return { data: await promises.readFile(file) };
		}
		case 'buffer': {
			if (Buffer.isBuffer(data)) return { data };
			// @ts-expect-error
			if (typeof data[Symbol.asyncIterator] === 'function') {
				const buffers = [];
				for await (const resource of data as unknown as AsyncIterable<ArrayBuffer>) buffers.push(Buffer.from(resource));
				return { data: Buffer.concat(buffers) };
			}
			return throwError(
				`The attachment type has been expressed as ${type.toUpperCase()} but cannot be resolved as one.`,
			);
		}
		default: {
			return throwError(`The attachment type has been expressed as ${type} but cannot be resolved as one.`);
		}
	}
}

/**
 * Resolves a base64 data to a data URL.
 * @param data - The base64 data.
 * @returns The resolved data URL.
 */
export function resolveBase64(data: string | Buffer) {
	if (Buffer.isBuffer(data)) return `data:image/jpg;base64,${data.toString('base64')}`;
	return data;
}

/**
 * Resolves an image to a base64 data URL.
 * @param image - The image to resolve.
 * @returns The resolved base64 data URL.
 */
export async function resolveImage(image: ImageResolvable): Promise<string> {
	if (image instanceof AttachmentBuilder) {
		const {
			data: { type, resolvable },
		} = image;
		if (type && resolvable) return resolveBase64((await resolveAttachmentData(resolvable, type)).data as Buffer);
		return throwError(
			`The attachment type has been expressed as ${(type ?? 'Attachment').toUpperCase()} but cannot be resolved as one.`,
		);
	}

	if (image instanceof Attachment) {
		const response = await fetch(image.url);
		return resolveBase64((await resolveAttachmentData(await response.arrayBuffer(), 'buffer')).data as Buffer);
	}

	const file = await resolveAttachmentData(image.data, image.type);
	return resolveBase64(file.data as Buffer);
}
