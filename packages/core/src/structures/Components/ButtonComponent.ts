import {
	APIButtonComponentWithCustomId,
	APIButtonComponentWithURL,
	APIMessageComponentEmoji,
	ButtonStyle,
	ComponentType,
} from "discord-api-types/v10";
import { BaseComponent } from "../extra/BaseComponent";

export class LinkButtonComponent extends BaseComponent<ComponentType.Button> {
	constructor(data: APIButtonComponentWithURL) {
		super(data);
		this.label = data.label;
		this.emoji = data.emoji;
		this.disabled = !!data.disabled;
		this.url = data.url;
	}

	style = ButtonStyle.Link;
	label?: string;
	emoji?: APIMessageComponentEmoji;
	disabled: boolean;
	url: string;
}

export type ButtonStyleExludeLink = Exclude<ButtonStyle, ButtonStyle.Link>;

export class ButtonComponent extends BaseComponent<ComponentType.Button> {
	constructor(data: APIButtonComponentWithCustomId) {
		super(data);
		this.style = data.style;
		this.label = data.label;
		this.emoji = data.emoji;
		this.disabled = !!data.disabled;
	}

	style: ButtonStyleExludeLink;
	label?: string;
	emoji?: APIMessageComponentEmoji;
	disabled: boolean;
}
