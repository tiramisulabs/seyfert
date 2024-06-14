import type { ComponentType } from 'discord-api-types/v10';
import { BaseComponent } from './BaseComponent';

export class TextInputComponent extends BaseComponent<ComponentType.TextInput> {
	get customId() {
		return this.data.custom_id;
	}

	get value() {
		return this.data.value;
	}

	get style() {
		return this.data.style;
	}

	get label() {
		return this.data.label;
	}

	get max() {
		return this.data.max_length;
	}

	get min() {
		return this.data.min_length;
	}

	get required() {
		return this.data.required;
	}

	get placeholder() {
		return this.data.placeholder;
	}
}
