import type { ComponentType } from '../types';
import { BaseComponent } from './BaseComponent';

export class MediaGalleryComponent extends BaseComponent<ComponentType.MediaGallery> {
	get items() {
		return this.data.items;
	}

	get id() {
		return this.data.id;
	}
}
