import { type APIFileUploadComponent, ComponentType } from '../types';
import { BaseComponentBuilder } from './Base';

export class FileUpload extends BaseComponentBuilder<APIFileUploadComponent> {
	constructor(data: Partial<APIFileUploadComponent> = {}) {
		super({ type: ComponentType.FileUpload, ...data });
	}

	/**
	 * Sets the ID for the file upload.
	 * @param id - The ID for the file upload.
	 * @returns The current FileUpload instance.
	 */
	setId(id: string) {
		this.data.id = id;
		return this;
	}

	/**
	 * Sets the custom ID for the file upload.
	 * @param customId - The custom ID for the file upload.
	 * @returns The current FileUpload instance.
	 */
	setCustomId(customId: string) {
		this.data.custom_id = customId;
		return this;
	}

	/**
	 * Sets the minimum number of items that must be uploaded.
	 * @param minValues - The minimum number of items that must be uploaded.
	 * @returns The current FileUpload instance.
	 */
	setMinValues(minValues: number) {
		this.data.min_values = minValues;
		return this;
	}

	/**
	 * Sets the maximum number of items that can be uploaded.
	 * @param maxValues - The maximum number of items that can be uploaded.
	 * @returns The current FileUpload instance.
	 */
	setMaxValues(maxValues: number) {
		this.data.max_values = maxValues;
		return this;
	}

	/**
	 * Sets whether the file upload is required.
	 * @param required - Whether the file upload is required.
	 * @returns The current FileUpload instance.
	 */
	setRequired(required: boolean) {
		this.data.required = required;
		return this;
	}
}
