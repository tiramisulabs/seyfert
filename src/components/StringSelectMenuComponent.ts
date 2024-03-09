import type { APISelectMenuOption, APIStringSelectComponent, ComponentType } from '../common';
import { BaseSelectMenuComponent } from '../structures/extra/BaseSelectMenuComponent';

export class StringSelectMenuComponent extends BaseSelectMenuComponent<ComponentType.StringSelect> {
	constructor(data: APIStringSelectComponent) {
		super(data);

		this.options = data.options;
	}

	options: APISelectMenuOption[];
}
