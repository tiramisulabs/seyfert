import type { ComponentType } from '../common';
import { BaseSelectMenuComponent } from './BaseSelectMenuComponent';

export class UserSelectMenuComponent extends BaseSelectMenuComponent<ComponentType.UserSelect> {
	get defaultValues() {
		return this.data.default_values;
	}
}
