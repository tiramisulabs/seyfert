import type { APIBaseComponent, ComponentType } from '../../common';

export interface BaseComponent<T extends ComponentType> extends APIBaseComponent<T> {}

export class BaseComponent<T extends ComponentType> {
	constructor(data: APIBaseComponent<T>) {
		Object.assign(this, data);
	}

	toJSON() {
		return { type: this.type };
	}
}
