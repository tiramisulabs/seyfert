import { type APILabelComponent, ComponentType } from '../types';
import { fromComponent } from '.';
import { BaseComponentBuilder } from './Base';
import type { TextInput } from './Modal';
import type { StringSelectMenu } from './SelectMenu';

export class Label extends BaseComponentBuilder<APILabelComponent> {
	constructor({ component, ...data }: Partial<APILabelComponent> = {}) {
		super({ type: ComponentType.Label, ...data });
		if (component) this.component = fromComponent(component) as TextInput | StringSelectMenu;
	}
	component?: TextInput | StringSelectMenu;

	setLabel(label: string): this {
		this.data.label = label;
		return this;
	}

	setDescription(description: string): this {
		this.data.description = description;
		return this;
	}

	setComponent(component: TextInput | StringSelectMenu): this {
		this.component = component;
		return this;
	}

	toJSON(): APILabelComponent {
		if (!this.component) throw new Error('Cannot convert to JSON without a component.');
		return {
			...(this.data as APILabelComponent),
			component: this.component.toJSON(),
		};
	}
}
