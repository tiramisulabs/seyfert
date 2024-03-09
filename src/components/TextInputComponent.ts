import type { APIModalComponent, APITextInputComponent, ComponentType } from '../common';
import { BaseComponent } from '../structures/extra/BaseComponent';

export class TextInputComponent extends BaseComponent<ComponentType.TextInput> {
	constructor(data: APITextInputComponent) {
		super(data);

		this.customId = data.custom_id;
		this.value = data.value!;
	}

	customId: string;
	value: string | APIModalComponent;
}
