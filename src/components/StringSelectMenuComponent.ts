import type { ComponentType } from '../types';
import { BaseSelectMenuComponent } from './BaseSelectMenuComponent';

export class StringSelectMenuComponent extends BaseSelectMenuComponent<ComponentType.StringSelect> {
	get options() {
		return this.data.options;
	}
}
