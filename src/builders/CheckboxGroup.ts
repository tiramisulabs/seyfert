import type { RestOrArray } from '../common';
import { type APICheckboxGroupComponent, type APICheckboxGroupOption, ComponentType } from '../types';
import { BaseComponentBuilder, type OptionValuesLength } from './Base';

export class CheckboxGroup extends BaseComponentBuilder<APICheckboxGroupComponent> {
	#options: CheckboxGroupOption[] = [];
	constructor(data: Partial<APICheckboxGroupComponent> = {}) {
		super({ type: ComponentType.CheckboxGroup, ...data });
	}

	/**
	 * Sets the ID for the checkbox group.
	 * @param id - The ID for the checkbox group.
	 * @return The current CheckboxGroup instance.
	 * @remarks The ID is used by Discord to identify the component when an interaction is received. It must be unique within the message.
	 */
	setId(id: number) {
		this.data.id = id;
		return this;
	}
	/**
	 *  Sets the custom ID for the checkbox group.
	 * @param customId - The custom ID for the checkbox group.
	 * @returns The current CheckboxGroup instance.
	 */
	setCustomId(customId: string) {
		this.data.custom_id = customId;
		return this;
	}

	/**
	 * Sets the maximum and minimum number of selected values for the checkbox group.
	 * [max = options length] 10, [min = 1] 0
	 * @param options - The maximum and minimum values.
	 * @returns The current CheckboxGroup instance.
	 */
	setSelectionLimit({ max, min }: Partial<OptionValuesLength>): this {
		this.data.max_values = max;
		this.data.min_values = min;
		return this;
	}

	/**
	 * Sets whether the checkbox group is required.
	 * @param required - Whether the checkbox group is required (true by discord side).
	 * @returns The current CheckboxGroup instance.
	 */
	setRequired(required: boolean) {
		this.data.required = required;
		return this;
	}

	setOptions(...options: RestOrArray<CheckboxGroupOption>) {
		this.#options = options.flat();
		return this;
	}

	addOptions(...options: RestOrArray<CheckboxGroupOption>) {
		this.#options = this.#options.concat(options.flat());
		return this;
	}

	toJSON(): APICheckboxGroupComponent {
		const options = [...this.#options.map(option => option.toJSON()), ...(this.data.options ?? [])];
		const optionCount = options.length;
		if (optionCount < 2 || optionCount > 10) {
			throw new Error('RadioGroup must have between 2 and 10 options.');
		}
		return {
			...this.data,
			options,
		} as APICheckboxGroupComponent;
	}
}

export class CheckboxGroupOption {
	constructor(public data: APICheckboxGroupOption) {}

	/**
	 * Sets the value of the checkbox group option.
	 * @param value - The value of the checkbox group option.
	 * @return The current CheckboxGroupOption instance.
	 * @remarks The value is sent to the bot when the option is selected. It must be unique within the options of the checkbox group.
	 * The value can be up to 100 characters long.
	 */
	setValue(value: string) {
		this.data.value = value;
		return this;
	}

	/**
	 * Sets the label of the checkbox group option.
	 * @param label - The label of the checkbox group option.
	 * @return The current CheckboxGroupOption instance.
	 * @remarks The label is displayed to the user. It can be up to 100 characters long.
	 */
	setLabel(label: string) {
		this.data.label = label;
		return this;
	}

	/**
	 * Sets the description of the checkbox group option.
	 * @param description - The description of the checkbox group option.
	 * @return The current CheckboxGroupOption instance.
	 */
	setDescription(description: string) {
		this.data.description = description;
		return this;
	}

	/**
	 * Sets whether the checkbox group option is default.
	 * @param value - Whether the checkbox group option is default.
	 * @return The current CheckboxGroupOption instance.
	 */
	setDefault(value: boolean) {
		this.data.default = value;
		return this;
	}

	toJSON() {
		return { ...this.data };
	}
}
