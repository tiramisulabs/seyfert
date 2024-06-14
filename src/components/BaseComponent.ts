import {
	type APIActionRowComponent,
	type APIActionRowComponentTypes,
	type APIButtonComponent,
	type APIChannelSelectComponent,
	type APIMentionableSelectComponent,
	type APIRoleSelectComponent,
	type APIStringSelectComponent,
	type APITextInputComponent,
	type APIUserSelectComponent,
	ComponentType,
} from 'discord-api-types/v10';
import { fromComponent } from '../builders';

export class BaseComponent<T extends ComponentType> {
	constructor(public data: APIComponentsMap[T]) {}

	get type() {
		return this.data.type;
	}

	toJSON() {
		return this.data;
	}

	toBuilder() {
		return fromComponent(this.data);
	}
}
export interface APIComponentsMap {
	[ComponentType.ActionRow]: APIActionRowComponent<APIActionRowComponentTypes>;
	[ComponentType.Button]: APIButtonComponent;
	[ComponentType.ChannelSelect]: APIChannelSelectComponent;
	[ComponentType.MentionableSelect]: APIMentionableSelectComponent;
	[ComponentType.RoleSelect]: APIRoleSelectComponent;
	[ComponentType.StringSelect]: APIStringSelectComponent;
	[ComponentType.UserSelect]: APIUserSelectComponent;
	[ComponentType.TextInput]: APITextInputComponent;
}
