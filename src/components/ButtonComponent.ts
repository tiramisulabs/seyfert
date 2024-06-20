import type {
	APIButtonComponentWithCustomId,
	APIButtonComponentWithSKUId,
	APIButtonComponentWithURL,
	ButtonStyle,
	ComponentType,
} from 'discord-api-types/v10';
import { Button } from '../builders';
import { BaseComponent } from './BaseComponent';

export class LinkButtonComponent extends BaseComponent<ComponentType.Button> {
	declare data: APIButtonComponentWithURL;
	get style() {
		return this.data.style;
	}

	get url(): string {
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
		return new Button(this.data);
	}
}

export type ButtonStyleExludeLink = Exclude<ButtonStyle, ButtonStyle.Link>;

export class ButtonComponent extends BaseComponent<ComponentType.Button> {
	declare data: APIButtonComponentWithCustomId;
	get style() {
		return this.data.style;
	}

	get customId() {
		return this.data.custom_id;
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
		return new Button(this.data);
	}
}

export class SKUButtonComponent extends BaseComponent<ComponentType.Button> {
	declare data: APIButtonComponentWithSKUId;
	get style() {
		return this.data.style;
	}

	get skuId() {
		return this.data.sku_id;
	}

	get disabled() {
		return this.data.disabled;
	}

	toBuilder() {
		return new Button(this.data as never);
	}
}
