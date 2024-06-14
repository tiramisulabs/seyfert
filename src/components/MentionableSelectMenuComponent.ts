import type { ComponentType } from 'discord-api-types/v10';
import { BaseSelectMenuComponent } from './BaseSelectMenuComponent';

export class MentionableSelectMenuComponent extends BaseSelectMenuComponent<ComponentType.MentionableSelect> {
	get defaultValues() {
		return this.data.default_values;
	}
}
