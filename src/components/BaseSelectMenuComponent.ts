import type { ComponentType } from 'discord-api-types/v10';
import { BaseComponent } from './BaseComponent';

export type APISelectMenuComponentTypes =
	| ComponentType.ChannelSelect
	| ComponentType.MentionableSelect
	| ComponentType.RoleSelect
	| ComponentType.StringSelect
	| ComponentType.UserSelect;

export class BaseSelectMenuComponent<T extends APISelectMenuComponentTypes> extends BaseComponent<T> {
	get customId() {
		return this.data.custom_id;
	}

	get disabed() {
		return this.data.disabled;
	}

	get max() {
		return this.data.max_values;
	}

	get min() {
		return this.data.min_values;
	}

	get placeholder() {
		return this.data.placeholder;
	}
}
