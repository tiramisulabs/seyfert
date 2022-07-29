import type { Session } from '../biscuit';
import type {
	DiscordComponent,
	DiscordInputTextComponent,
	TextStyles,
} from '@biscuitland/api-types';
import { Emoji } from './emojis';
import { ButtonStyles, MessageComponentTypes } from '@biscuitland/api-types';

export class BaseComponent {
	constructor(type: MessageComponentTypes) {
		this.type = type;
	}

	type: MessageComponentTypes;

	isActionRow(): this is ActionRowComponent {
		return this.type === MessageComponentTypes.ActionRow;
	}

	isButton(): this is ButtonComponent {
		return this.type === MessageComponentTypes.Button;
	}

	isSelectMenu(): this is SelectMenuComponent {
		return this.type === MessageComponentTypes.SelectMenu;
	}

	isTextInput(): this is TextInputComponent {
		return this.type === MessageComponentTypes.InputText;
	}
}

/** Action Row Component */
export interface ActionRowComponent {
	type: MessageComponentTypes.ActionRow;
	components: Exclude<Component, ActionRowComponent>[];
}

/** All Components */
export type Component =
	| ActionRowComponent
	| ButtonComponent
	| LinkButtonComponent
	| SelectMenuComponent
	| TextInputComponent;

/** Button Component */
export type ClassicButton = Exclude<ButtonStyles, ButtonStyles.Link>;

export type ComponentsWithoutRow = Exclude<Component, ActionRowComponent>;

export interface ButtonComponent {
	type: MessageComponentTypes.Button;
	style: ClassicButton;
	label?: string;
	emoji?: Emoji;
	customId?: string;
	disabled?: boolean;
}

/** Link Button Component */
export interface LinkButtonComponent {
	type: MessageComponentTypes.Button;
	style: ButtonStyles.Link;
	label?: string;
	url: string;
	disabled?: boolean;
}

/** Select Menu Component */
export interface SelectMenuComponent {
	type: MessageComponentTypes.SelectMenu;
	customId: string;
	options: SelectMenuOption[];
	placeholder?: string;
	minValue?: number;
	maxValue?: number;
	disabled?: boolean;
}

/** Text Input Component */
export interface TextInputComponent {
	type: MessageComponentTypes.InputText;
	customId: string;
	style: TextStyles;
	label: string;
	minLength?: number;
	maxLength?: number;
	required?: boolean;
	value?: string;
	placeholder?: string;
}

export interface SelectMenuOption {
	label: string;
	value: string;
	description?: string;
	emoji?: Emoji;
	default?: boolean;
}

export class Button extends BaseComponent implements ButtonComponent {
	constructor(session: Session, data: DiscordComponent) {
		super(data.type);

		this.session = session;
		this.type = data.type as MessageComponentTypes.Button;
		this.customId = data.custom_id;
		this.label = data.label;
		this.style = data.style as ClassicButton;
		this.disabled = data.disabled;

		if (data.emoji) {
			this.emoji = new Emoji(session, data.emoji);
		}
	}

	readonly session: Session;
	override type: MessageComponentTypes.Button;
	customId?: string;
	label?: string;
	style: ClassicButton;
	disabled?: boolean;
	emoji?: Emoji;
}

export class LinkButton extends BaseComponent implements LinkButtonComponent {
	constructor(session: Session, data: DiscordComponent) {
		super(data.type);

		this.session = session;
		this.type = data.type as MessageComponentTypes.Button;
		this.url = data.url!;
		this.label = data.label;
		this.style = data.style as number;
		this.disabled = data.disabled;

		if (data.emoji) {
			this.emoji = new Emoji(session, data.emoji);
		}
	}

	readonly session: Session;
	override type: MessageComponentTypes.Button;
	url: string;
	label?: string;
	style: ButtonStyles.Link;
	disabled?: boolean;
	emoji?: Emoji;
}

export class SelectMenu extends BaseComponent implements SelectMenuComponent {
	constructor(session: Session, data: DiscordComponent) {
		super(data.type);

		this.session = session;
		this.type = data.type as MessageComponentTypes.SelectMenu;
		this.customId = data.custom_id!;
		this.options = data.options!.map(option => {
			return <SelectMenuOption>{
				label: option.label,
				description: option.description,
				emoji: option.emoji || new Emoji(session, option.emoji!),
				value: option.value,
			};
		});
		this.placeholder = data.placeholder;
		this.minValues = data.min_values;
		this.maxValues = data.max_values;
		this.disabled = data.disabled;
	}

	readonly session: Session;
	override type: MessageComponentTypes.SelectMenu;
	customId: string;
	options: SelectMenuOption[];
	placeholder?: string;
	minValues?: number;
	maxValues?: number;
	disabled?: boolean;
}

export class TextInput extends BaseComponent implements TextInputComponent {
	constructor(session: Session, data: DiscordInputTextComponent) {
		super(data.type);

		this.session = session;
		this.type = data.type as MessageComponentTypes.InputText;
		this.customId = data.custom_id!;
		this.label = data.label!;
		this.style = data.style as TextStyles;

		this.placeholder = data.placeholder;
		this.value = data.value;

		this.minLength = data.min_length;
		this.maxLength = data.max_length;
	}

	readonly session: Session;
	override type: MessageComponentTypes.InputText;
	style: TextStyles;
	customId: string;
	label: string;
	placeholder?: string;
	value?: string;
	minLength?: number;
	maxLength?: number;
}

export class ActionRow extends BaseComponent implements ActionRowComponent {
	constructor(session: Session, data: DiscordComponent) {
		super(data.type);

		this.session = session;
		this.type = data.type as MessageComponentTypes.ActionRow;
		this.components = data.components!.map(component => {
			switch (component.type) {
				case MessageComponentTypes.Button:
					if (component.style === ButtonStyles.Link) {
						return new LinkButton(session, component);
					}
					return new Button(session, component);
				case MessageComponentTypes.SelectMenu:
					return new SelectMenu(session, component);
				case MessageComponentTypes.InputText:
					return new TextInput(
						session,
						component as DiscordInputTextComponent
					);
				case MessageComponentTypes.ActionRow:
					throw new Error(
						'Cannot have an action row inside an action row'
					);
			}
		});
	}

	readonly session: Session;
	override type: MessageComponentTypes.ActionRow;
	components: ComponentsWithoutRow[];
}

export class ComponentFactory {
	/**
	 * Component factory
	 * @internal
	 */
	static from(session: Session, component: DiscordComponent): Component {
		switch (component.type) {
			case MessageComponentTypes.ActionRow:
				return new ActionRow(session, component);
			case MessageComponentTypes.Button:
				if (component.style === ButtonStyles.Link) {
					return new LinkButton(session, component);
				}
				return new Button(session, component);
			case MessageComponentTypes.SelectMenu:
				return new SelectMenu(session, component);
			case MessageComponentTypes.InputText:
				return new TextInput(
					session,
					component as DiscordInputTextComponent
				);
		}
	}
}
