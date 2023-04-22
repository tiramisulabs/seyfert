import { APIBaseComponent, ComponentType } from '@biscuitland/common';

export class BaseComponent<T extends ComponentType> {
	constructor(private data: APIBaseComponent<T>) {
		this.type = data.type;
	}

	type: T;

	toJSON() {
		return { ...this.data };
	}
}
