import { type ActionRow, fromComponent } from '.';
import { type ColorResolvable, type RestOrArray, resolveColor } from '../common';
import { type APIContainerComponent, ComponentType } from '../types';
import { BaseComponentBuilder } from './Base';
import type { File } from './File';
import type { MediaGallery } from './MediaGallery';
import type { Section } from './Section';
import type { Separator } from './Separator';
import type { TextDisplay } from './TextDisplay';

/**
 * Represents the possible component types that can be added to a Container.
 */
export type ContainerBuilderComponents = ActionRow | TextDisplay | Section | MediaGallery | Separator | File;

/**
 * Represents a container component builder.
 * Containers group other components together.
 * @example
 * ```ts
 * const container = new Container()
 *  .addComponents(
 *      new TextDisplay('This is text inside a container!'),
 *      new ActionRow().addComponents(new Button().setLabel('Click me!'))
 *  )
 *  .setColor('Blue');
 * ```
 */
export class Container extends BaseComponentBuilder<APIContainerComponent> {
	/**
	 * The components held within this container.
	 */
	components: ContainerBuilderComponents[];

	/**
	 * Constructs a new Container.
	 * @param data Optional initial data for the container.
	 */
	constructor({ components, ...data }: Partial<APIContainerComponent> = {}) {
		super({ ...data, type: ComponentType.Container });
		this.components = (components?.map(fromComponent) ?? []) as ContainerBuilderComponents[];
	}

	/**
	 * Adds components to the container.
	 * @param components The components to add. Can be a single component, an array of components, or multiple components as arguments.
	 * @returns The updated Container instance.
	 */
	addComponents(...components: RestOrArray<ContainerBuilderComponents>) {
		this.components = this.components.concat(components.flat());
		return this;
	}

	/**
	 * Sets the components for the container, replacing any existing components.
	 * @param components The components to set. Can be a single component, an array of components, or multiple components as arguments.
	 * @returns The updated Container instance.
	 */
	setComponents(...components: RestOrArray<ContainerBuilderComponents>) {
		this.components = components.flat();
		return this;
	}

	/**
	 * Sets whether the container's content should be visually marked as a spoiler.
	 * @param spoiler Whether the content is a spoiler (defaults to true).
	 * @returns The updated Container instance.
	 */
	setSpoiler(spoiler = true) {
		this.data.spoiler = spoiler;
		return this;
	}

	/**
	 * Sets the accent color for the container.
	 * @param color The color resolvable (e.g., hex code, color name, integer).
	 * @returns The updated Container instance.
	 */
	setColor(color: ColorResolvable) {
		this.data.accent_color = resolveColor(color);
		return this;
	}

	/**
	 * Sets the ID for the container.
	 * @param id The ID to set.
	 * @returns The updated Container instance.
	 */
	setId(id: number) {
		this.data.id = id;
		return this;
	}

	toJSON() {
		return {
			...this.data,
			components: this.components.map(c => c.toJSON()),
		} as APIContainerComponent;
	}
}
