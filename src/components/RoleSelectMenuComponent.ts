import type { ComponentType } from '../common';
import { BaseSelectMenuComponent } from './BaseSelectMenuComponent';

export class RoleSelectMenuComponent extends BaseSelectMenuComponent<ComponentType.RoleSelect> {
	get defaultValues() {
		return this.data.default_values;
	}
}
