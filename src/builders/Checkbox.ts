import { type APICheckboxComponent, ComponentType } from '../types';
import { BaseComponentBuilder } from './Base';

export class Checkbox extends BaseComponentBuilder<APICheckboxComponent> {
	constructor(data: Partial<APICheckboxComponent> = {}) {
		super({ type: ComponentType.Checkbox, ...data });
	}

	/**
	 * Sets the ID for the checkbox.
	 * @param id - The ID for the checkbox.
	 * @returns The current Checkbox instance.
	 * @remarks The ID is used by Discord to identify the component when an interaction is received. It must be unique within the message.
	 */
	setId(id: number) {
		this.data.id = id;
		return this;
	}

	/**
	 * Sets the custom ID for the checkbox.
	 * @param customId - The custom ID for the checkbox.
	 * @returns The current Checkbox instance.
	 */
	setCustomId(customId: string) {
		this.data.custom_id = customId;
		return this;
	}

	/**
	 * Sets whether the checkbox is selected by default.
	 * @param value - Whether the checkbox is selected by default.
	 * @return The current Checkbox instance.
	 */
	setDefault(value: boolean) {
		this.data.default = value;
		return this;
	}
}
