import { createValidationMetadata, type RestOrArray, SeyfertError } from '../common';
import { type APISectionComponent, ComponentType } from '../types';
import { type Button, fromComponent } from '.';
import { BaseComponentBuilder } from './Base';
import type { TextDisplay } from './TextDisplay';
import type { Thumbnail } from './Thumbnail';

export class Section<
	Ac extends Button | Thumbnail = Button | Thumbnail,
> extends BaseComponentBuilder<APISectionComponent> {
	components: TextDisplay[];
	accessory?: Ac;
	constructor({ components, accessory, ...data }: Partial<APISectionComponent> = {}) {
		super({ type: ComponentType.Section, ...data });
		this.components = (components?.map(component => fromComponent(component)) ?? []) as TextDisplay[];
		if (accessory) this.accessory = fromComponent(accessory) as Ac;
	}

	/**
	 * Adds components to this section.
	 * @param components The components to add
	 * @example section.addComponents(new TextDisplay().content('Hello'));
	 */
	addComponents(...components: RestOrArray<TextDisplay>) {
		this.components = this.components.concat(components.flat());
		return this;
	}

	/**
	 * Sets the components for this section.
	 * @param components The components to set
	 * @example section.setComponents(new TextDisplay().content('Hello'));
	 */
	setComponents(...components: RestOrArray<TextDisplay>) {
		this.components = components.flat();
		return this;
	}

	setAccessory(accessory: Ac) {
		this.accessory = accessory;
		return this;
	}

	/**
	 * Converts this section to JSON.
	 * @returns The JSON representation of this section
	 */
	toJSON() {
		if (!this.accessory)
			throw new SeyfertError('Cannot convert to JSON without an accessory.', {
				code: 'MISSING_ACCESSORY',
				metadata: createValidationMetadata('accessory to be set before calling toJSON()', this.accessory, {
					component: 'Section',
				}),
			});
		return {
			...this.data,
			components: this.components.map(component => component.toJSON()),
			accessory: this.accessory.toJSON(),
		} as APISectionComponent;
	}
}
