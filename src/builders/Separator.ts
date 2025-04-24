import { type APISeparatorComponent, ComponentType, type Spacing } from '../types';
import { BaseComponentBuilder } from './Base';

/**
 * Represents a separator component builder.
 * Used to add visual spacing or dividers between components.
 * @example
 * ```ts
 * // A simple separator for spacing
 * const spacingSeparator = new Separator().setSpacing(Spacing.Small);
 *
 * // A separator acting as a visual divider
 * const dividerSeparator = new Separator().setDivider(true);
 * ```
 */
export class Separator extends BaseComponentBuilder<APISeparatorComponent> {
	/**
	 * Constructs a new Separator component.
	 * @param data Optional initial data for the separator component.
	 */
	constructor(data: Partial<APISeparatorComponent> = {}) {
		super({ type: ComponentType.Separator, ...data });
	}

	/**
	 * Sets the ID for the separator component.
	 * @param id The ID to set.
	 * @returns The updated Separator instance.
	 */
	setId(id: number) {
		this.data.id = id;
		return this;
	}

	/**
	 * Sets whether this separator should act as a visual divider.
	 * @param divider Whether to render as a divider (defaults to false).
	 * @returns The updated Separator instance.
	 */
	setDivider(divider = false) {
		this.data.divider = divider;
		return this;
	}

	/**
	 * Sets the amount of spacing this separator provides.
	 * @param spacing The desired spacing level ('None', 'Small', 'Medium', 'Large').
	 * @returns The updated Separator instance.
	 */
	setSpacing(spacing: Spacing) {
		this.data.spacing = spacing;
		return this;
	}
}
