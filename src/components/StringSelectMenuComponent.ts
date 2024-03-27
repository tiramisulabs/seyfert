import type { ComponentType } from '../common';
import { BaseSelectMenuComponent } from './BaseSelectMenuComponent';

export class StringSelectMenuComponent extends BaseSelectMenuComponent<ComponentType.StringSelect> {
	get options() {
		return this.data.options;
	}
}
