import type { RestOrArray } from '../common';
import { type APIRadioGroupComponent, type APIRadioGroupOption, ComponentType } from '../types';
import { BaseComponentBuilder } from './Base';

export class RadioGroup extends BaseComponentBuilder<APIRadioGroupComponent> {
	#options: RadioGroupOption[] = [];
	constructor(data: Partial<APIRadioGroupComponent> = {}) {
		super({ type: ComponentType.RadioGroup, ...data });
	}

	/**
	 * Sets the ID for the file upload.
	 * @param id - The ID for the file upload.
	 * @returns The current FileUpload instance.
	 */
	setId(id: number) {
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

	setOptions(options: RestOrArray<RadioGroupOption>) {
		this.#options = options.flat();
		return this;
	}

	addOptions(...options: RestOrArray<RadioGroupOption>) {
		this.#options = this.#options.concat(options.flat());
		return this;
	}

	/**
	 * Sets whether the file upload is required.
	 * @param required - Whether the file upload is required (true by discord side).
	 * @returns The current FileUpload instance.
	 */
	setRequired(required: boolean) {
		this.data.required = required;
		return this;
	}

	toJSON() {
		if (this.#options.length === 0 && this.data.options?.length === 0)
			throw new Error('RadioGroup must have at least one option.');
		return {
			...this.data,
			options: [...this.#options.map(option => option.data as APIRadioGroupOption), ...(this.data.options ?? [])],
		} as APIRadioGroupComponent;
	}
}

export class RadioGroupOption {
	constructor(public data: Partial<APIRadioGroupOption> = {}) {}

	/**
	 * Sets the label for the option.
	 *  label - The label for the option.
	 * @returns The current StringSelectOption instance.
	 */
	setLabel(label: string): this {
		this.data.label = label;
		return this;
	}

	/**
	 * Sets the value for the option.
	 *  value - The value for the option.
	 * @returns The current StringSelectOption instance.
	 */
	setValue(value: string): this {
		this.data.value = value;
		return this;
	}

	/**
	 * Sets the description for the option.
	 *  description - The description for the option.
	 * @returns The current StringSelectOption instance.
	 */
	setDescription(description: string): this {
		this.data.description = description;
		return this;
	}

	/**
	 * Sets whether the option is the default.
	 *  [value=true] - Indicates whether the option is the default (true by discord side).
	 * @returns The current StringSelectOption instance.
	 */
	setDefault(value = true): this {
		this.data.default = value;
		return this;
	}
}
