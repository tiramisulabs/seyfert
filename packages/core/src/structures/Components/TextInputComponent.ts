import { APIModalComponent, APITextInputComponent, ComponentType } from "discord-api-types/v10";
import { BaseComponent } from "../extra/BaseComponent";

export class TextInputComponent extends BaseComponent<ComponentType.TextInput> {
	constructor(data: APITextInputComponent) {
		super(data);

		this.customId = data.custom_id;
		this.value = data.value!;
	}
	customId: string;
	value: string | APIModalComponent;
}
