import type { ComponentType } from '../common';
import { BaseSelectMenuComponent } from './BaseSelectMenuComponent';

export class MentionableSelectMenuComponent extends BaseSelectMenuComponent<ComponentType.MentionableSelect> {
	get defaultValues() {
		return this.data.default_values;
	}
}
