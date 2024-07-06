import type { APIMessageActionRowComponent, ComponentType } from 'discord-api-types/v10';
import { BaseComponent } from './BaseComponent';
import type { ActionRowMessageComponents } from './index';
import { componentFactory } from './index';

export class MessageActionRowComponent<
	T extends ActionRowMessageComponents,
> extends BaseComponent<ComponentType.ActionRow> {
	private ComponentsFactory: T[];
	constructor(data: {
		type: ComponentType.ActionRow;
		components: APIMessageActionRowComponent[];
	}) {
		super(data);
		this.ComponentsFactory = data.components.map(componentFactory) as T[];
	}

	get components() {
		return this.ComponentsFactory;
	}
}
