import { type ContainerComponents, componentFactory } from '.';
import type { APIContainerComponent, ComponentType } from '../types';
import { BaseComponent } from './BaseComponent';

export class ContainerComponent extends BaseComponent<ComponentType.Container> {
	_components: ContainerComponents[];
	constructor(data: APIContainerComponent) {
		super(data);
		this._components = this.data.components.map(componentFactory) as ContainerComponents[];
	}

	get components() {
		return this.data.components;
	}

	get accentColor() {
		return this.data.accent_color;
	}

	get spoiler() {
		return this.data.spoiler;
	}
}
