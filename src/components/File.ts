import type { ComponentType } from '../types';
import { BaseComponent } from './BaseComponent';

export class FileComponent extends BaseComponent<ComponentType.File> {
	get spoiler() {
		return this.data.spoiler;
	}

	get file() {
		return this.data.file;
	}

	get id() {
		return this.data.id;
	}
}
