import { APIBaseSelectMenuComponent, ComponentType } from "discord-api-types/v10";
import { BaseComponent } from "./BaseComponent";

export type APISelectMenuComponentTypes =
	| ComponentType.ChannelSelect
	| ComponentType.MentionableSelect
	| ComponentType.RoleSelect
	| ComponentType.StringSelect
	| ComponentType.UserSelect;

export class BaseSelectMenuComponent<T extends APISelectMenuComponentTypes> extends BaseComponent<APISelectMenuComponentTypes> {
	constructor(data: APIBaseSelectMenuComponent<T>) {
		super(data);
		this.customId = data.custom_id;
		this.disabled = !!data.disabled;
		this.placedholder = data.placeholder;
		this.maxValues = data.max_values;
		this.minValues = data.max_values;
	}

	placedholder?: string;
	maxValues?: number;
	minValues?: number;
	customId: string;
	disabled: boolean;
}
