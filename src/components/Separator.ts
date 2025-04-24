import type { ComponentType } from '../types';
import { BaseComponent } from './BaseComponent';

export class SeparatorComponent extends BaseComponent<ComponentType.Separator> {
	get id() {
		return this.data.id;
	}

	get spacing() {
		return this.data.spacing;
	}

	get divider() {
		return this.data.divider;
	}
}
