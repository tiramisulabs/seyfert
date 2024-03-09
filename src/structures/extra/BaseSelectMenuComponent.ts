import type { APIBaseSelectMenuComponent, ComponentType, Identify, ObjectToLower } from '../../common';
import { BaseComponent } from './BaseComponent';

export type APISelectMenuComponentTypes =
	| ComponentType.ChannelSelect
	| ComponentType.MentionableSelect
	| ComponentType.RoleSelect
	| ComponentType.StringSelect
	| ComponentType.UserSelect;

export interface BaseSelectMenuComponent<T extends APISelectMenuComponentTypes>
	extends BaseComponent<T>,
		ObjectToLower<Identify<Omit<APIBaseSelectMenuComponent<APISelectMenuComponentTypes>, 'type'>>> {}

export class BaseSelectMenuComponent<T extends APISelectMenuComponentTypes> extends BaseComponent<T> {
	constructor(data: APIBaseSelectMenuComponent<T>) {
		super(data);
	}

	toJSON() {
		return { ...this };
	}
}
