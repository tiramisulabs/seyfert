import { APIBaseComponent, ComponentType } from "discord-api-types/v10";

export class BaseComponent<T extends ComponentType> {
	constructor(private data: APIBaseComponent<T>) {
		this.type = data.type;
	}

	type: T;

	toJSON() {
		return { ...this.data };
	}
}
