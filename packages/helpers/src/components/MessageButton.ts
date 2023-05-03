import {
	APIButtonComponentBase,
	APIMessageComponentEmoji,
	ButtonStyle,
	ComponentType,
	When,
} from "@biscuitland/common";
import { BaseComponent } from "./BaseComponent";

export type ButtonStylesForID = Exclude<ButtonStyle, ButtonStyle.Link>;

export interface APIButtonComponent<WI extends boolean = boolean>
	extends APIButtonComponentBase<When<WI, ButtonStylesForID, ButtonStyle.Link>> {
	url: When<WI, never, string>;

	custom_id: When<WI, string, never>;
}

export class MessageButton<WI extends boolean = boolean> extends BaseComponent<APIButtonComponent<WI>> {
	constructor(data: Partial<APIButtonComponent<WI>> = {}) {
		super({ ...data, type: ComponentType.Button });
	}

	setLabel(label: string): this {
		this.data.label = label;
		return this;
	}

	setEmoji(emoji: APIMessageComponentEmoji): this {
		this.data.emoji = emoji;
		return this;
	}

	setDisabled(disabled = true): this {
		this.data.disabled = disabled;
		return this;
	}

	setURL(url: string): MessageButton<false> {
		const ctx = this as MessageButton<false>;
		ctx.data.url = url;
		return ctx;
	}

	setStyle(style: When<WI, ButtonStylesForID, ButtonStyle.Link>): this {
		this.data.style = style;
		return this;
	}

	setCustomId(id: string): MessageButton<true> {
		const ctx = this as MessageButton<true>;
		ctx.data.custom_id = id;
		return ctx;
	}
}
