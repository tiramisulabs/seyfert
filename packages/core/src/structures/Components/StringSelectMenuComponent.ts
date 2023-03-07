import { APISelectMenuOption, APIStringSelectComponent, ComponentType } from "discord-api-types/v10";
import { BaseSelectMenuComponent } from "../extra/BaseSelectMenuComponent";

export class StringSelectMenuComponent extends BaseSelectMenuComponent<ComponentType.StringSelect> {
	constructor(data: APIStringSelectComponent) {
		super(data);

		this.options = data.options;
	}
	options: APISelectMenuOption[];
}
