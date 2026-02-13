import { createValidationMetadata, type RestOrArray, SeyfertError } from '../common';
import { type APIRadioGroupComponent, type APIRadioGroupOption, ComponentType } from '../types';
import { BaseComponentBuilder } from './Base';

export class RadioGroup extends BaseComponentBuilder<APIRadioGroupComponent> {
	#options: RadioGroupOption[] = [];
	constructor(data: Partial<APIRadioGroupComponent> = {}) {
		super({ type: ComponentType.RadioGroup, ...data });
	}

	/**
	 * Sets the ID for the radio group.
	 * @param id - The ID for the radio group.
	 * @returns The current RadioGroup instance.
	 */
	setId(id: number) {
		this.data.id = id;
		return this;
	}

	/**
	 * Sets the custom ID for the radio group.
	 * @param customId - The custom ID for the radio group.
	 * @returns The current RadioGroup instance.
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
	 * Sets whether the radio group is required.
	 * @param required - Whether the radio group is required (true by discord side).
	 * @returns The current RadioGroup instance.
	 */
	setRequired(required: boolean) {
		this.data.required = required;
		return this;
	}

	toJSON() {
		const options = [...this.#options.map(option => option.data as APIRadioGroupOption), ...(this.data.options ?? [])];
		const optionCount = options.length;
		if (optionCount < 2 || optionCount > 10) {
			throw new SeyfertError('RadioGroup must have between 2 and 10 options.', {
				code: 'INVALID_OPTIONS_LENGTH',
				metadata: createValidationMetadata('number of options between 2 and 10', optionCount, {
					component: 'RadioGroup',
				}),
			});
		}
		return {
			...this.data,
			options,
		} as APIRadioGroupComponent;
	}
}

export class RadioGroupOption {
	constructor(public data: Partial<APIRadioGroupOption> = {}) {}

	/**
	 * Sets the label for the option.
	 *  label - The label for the option.
	 * @returns The current RadioGroupOption instance.
	 */
	setLabel(label: string): this {
		this.data.label = label;
		return this;
	}

	/**
	 * Sets the value for the option.
	 *  value - The value for the option.
	 * @returns The current RadioGroupOption instance.
	 */
	setValue(value: string): this {
		this.data.value = value;
		return this;
	}

	/**
	 * Sets the description for the option.
	 *  description - The description for the option.
	 * @returns The current RadioGroupOption instance.
	 */
	setDescription(description: string): this {
		this.data.description = description;
		return this;
	}

	/**
	 * Sets whether the option is the default.
	 *  [value=true] - Indicates whether the option is the default (true by discord side).
	 * @returns The current RadioGroupOption instance.
	 */
	setDefault(value = true): this {
		this.data.default = value;
		return this;
	}
}
