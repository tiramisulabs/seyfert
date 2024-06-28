import type { APIAttachment, RESTAPIAttachment } from 'discord-api-types/v10';
import { type UsingClient, type RawFile } from '..';
import type { ImageResolvable, ObjectToLower } from '../common';
import { Base } from '../structures/extra/Base';
export interface AttachmentResolvableMap {
    url: string;
    buffer: Buffer | ArrayBuffer;
    path: string;
}
export type AttachmentResolvable = AttachmentResolvableMap[keyof AttachmentResolvableMap] | AttachmentBuilder | Attachment;
export type AttachmentDataType = keyof AttachmentResolvableMap;
export interface AttachmentData {
    name: string;
    description: string;
    resolvable: AttachmentResolvable;
    type: AttachmentDataType;
}
export interface Attachment extends ObjectToLower<APIAttachment> {
}
export declare class Attachment extends Base {
    data: APIAttachment;
    constructor(client: UsingClient, data: APIAttachment);
}
export declare class AttachmentBuilder {
    data: Partial<AttachmentData>;
    /**
     * Creates a new Attachment instance.
     * @param data - The partial attachment data.
     */
    constructor(data?: Partial<AttachmentData>);
    /**
     * Sets the name of the attachment.
     * @param name - The name of the attachment.
     * @returns The Attachment instance.
     * @example
     * attachment.setName('example.jpg');
     */
    setName(name: string): this;
    /**
     * Sets the description of the attachment.
     * @param desc - The description of the attachment.
     * @returns The Attachment instance.
     * @example
     * attachment.setDescription('This is an example attachment');
     */
    setDescription(desc: string): this;
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
    setFile<T extends AttachmentDataType = AttachmentDataType>(type: T, data: AttachmentResolvableMap[T]): this;
    /**
     * Sets whether the attachment is a spoiler.
     * @param spoiler - Whether the attachment is a spoiler.
     * @returns The Attachment instance.
     * @example
     * attachment.setSpoiler(true);
     */
    setSpoiler(spoiler: boolean): this;
    /**
     * Gets whether the attachment is a spoiler.
     */
    get spoiler(): boolean;
    /**
     * Converts the Attachment instance to JSON.
     * @returns The JSON representation of the Attachment instance.
     */
    toJSON(): AttachmentData;
}
/**
 * Resolves an attachment to a REST API attachment.
 * @param resolve - The attachment or attachment data to resolve.
 * @returns The resolved REST API attachment.
 */
export declare function resolveAttachment(resolve: Attachment | AttachmentData | RESTAPIAttachment): Omit<RESTAPIAttachment, 'id'>;
/**
 * Resolves a list of attachments to raw files.
 * @param resources - The list of attachments to resolve.
 * @returns The resolved raw files.
 */
export declare function resolveFiles(resources: (AttachmentBuilder | RawFile | Attachment)[]): Promise<RawFile[]>;
/**
 * Resolves the data of an attachment.
 * @param data - The resolvable data of the attachment.
 * @param type - The type of the attachment data.
 * @returns The resolved attachment data.
 */
export declare function resolveAttachmentData(data: AttachmentResolvable, type: AttachmentDataType): Promise<{
    data: AttachmentResolvable;
    contentType?: string | null;
}>;
/**
 * Resolves a base64 data to a data URL.
 * @param data - The base64 data.
 * @returns The resolved data URL.
 */
export declare function resolveBase64(data: string | Buffer): string;
/**
 * Resolves an image to a base64 data URL.
 * @param image - The image to resolve.
 * @returns The resolved base64 data URL.
 */
export declare function resolveImage(image: ImageResolvable): Promise<string>;
