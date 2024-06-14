import type { ComponentType } from 'discord-api-types/v10';
import { BaseSelectMenuComponent } from './BaseSelectMenuComponent';

export class StringSelectMenuComponent extends BaseSelectMenuComponent<ComponentType.StringSelect> {
	get options() {
		return this.data.options;
	}
}
