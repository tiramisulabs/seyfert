import type { ButtonStyle, ComponentType } from 'discord-api-types/v10';
import { Button, type ButtonStylesForID } from '../builders';
import { BaseComponent } from './BaseComponent';

export class LinkButtonComponent extends BaseComponent<ComponentType.Button> {
	get style() {
		return this.data.style as ButtonStyle.Link;
	}

	get url(): string {
		// @ts-expect-error
		return this.data.url;
	}

	get label() {
		return this.data.label;
	}

	get disabled() {
		return this.data.disabled;
	}

	get emoji() {
		return this.data.emoji;
	}

	toBuilder() {
		return new Button<false>(this.data as never);
	}
}

export type ButtonStyleExludeLink = Exclude<ButtonStyle, ButtonStyle.Link>;

export class ButtonComponent extends BaseComponent<ComponentType.Button> {
	get style() {
		return this.data.style as ButtonStylesForID;
	}

	get label() {
		return this.data.label;
	}

	get disabled() {
		return this.data.disabled;
	}

	get emoji() {
		return this.data.emoji;
	}

	toBuilder() {
		return new Button<true>(this.data as never);
	}
}
