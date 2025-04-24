import { componentFactory } from '.';
import type { APISectionComponent, ComponentType } from '../types';
import { BaseComponent } from './BaseComponent';
import type { ButtonComponent } from './ButtonComponent';
import type { TextDisplayComponent } from './TextDisplay';
import type { ThumbnailComponent } from './Thumbnail';

export class SectionComponent extends BaseComponent<ComponentType.Section> {
	protected _components: TextDisplayComponent[];
	protected _accessory: ThumbnailComponent | ButtonComponent;
	constructor(data: APISectionComponent) {
		super(data);
		this._components = data.components?.map(componentFactory) as TextDisplayComponent[];
		this._accessory = componentFactory(data.accessory) as ThumbnailComponent | ButtonComponent;
	}
	get components() {
		return this._components;
	}

	get accessory() {
		return this._accessory;
	}
}
