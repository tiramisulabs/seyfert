import type { ComponentType } from '../types';
import { BaseComponent } from './BaseComponent';

export class ThumbnailComponent extends BaseComponent<ComponentType.Thumbnail> {
	get id() {
		return this.data.id;
	}

	get media() {
		return this.data.media;
	}

	get description() {
		return this.data.description;
	}

	get spoiler() {
		return this.data.spoiler;
	}
}
