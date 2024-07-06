import type { ComponentType } from 'discord-api-types/v10';
import { BaseSelectMenuComponent } from './BaseSelectMenuComponent';

export class UserSelectMenuComponent extends BaseSelectMenuComponent<ComponentType.UserSelect> {
	get defaultValues() {
		return this.data.default_values;
	}
}
