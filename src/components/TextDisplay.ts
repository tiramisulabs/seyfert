import type { ComponentType } from '../types';
import { BaseComponent } from './BaseComponent';

export class TextDisplayComponent extends BaseComponent<ComponentType.TextDisplay> {
	get content() {
		return this.data.content;
	}
}
