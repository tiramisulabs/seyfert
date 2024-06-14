import type { ComponentType } from 'discord-api-types/v10';
import { BaseSelectMenuComponent } from './BaseSelectMenuComponent';

export class RoleSelectMenuComponent extends BaseSelectMenuComponent<ComponentType.RoleSelect> {
	get defaultValues() {
		return this.data.default_values;
	}
}
