import { APILabelComponent, ComponentType } from '../types';
import { componentFactory } from '.';
import { BaseComponent } from './BaseComponent';

export class LabelComponent extends BaseComponent<ComponentType.Label> {
	constructor(data: APILabelComponent) {
		super(data);
	}

	get label() {
		return this.data.label;
	}

	get description() {
		return this.data.description;
	}

	get component() {
		return componentFactory(this.data.component);
	}
}
