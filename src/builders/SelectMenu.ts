import {
	type APIChannelSelectComponent,
	type APIMentionableSelectComponent,
	type APIMessageComponentEmoji,
	type APIRoleSelectComponent,
	type APISelectMenuComponent,
	type APISelectMenuDefaultValue,
	type APISelectMenuOption,
	type APIStringSelectComponent,
	type APIUserSelectComponent,
	type ChannelType,
	ComponentType,
	SelectMenuDefaultValueType,
} from 'discord-api-types/v10';
import { throwError } from '..';
import type { EmojiResolvable, RestOrArray, ToClass } from '../common';
import type {
	ChannelSelectMenuInteraction,
	ComponentInteraction,
	MentionableSelectMenuInteraction,
	RoleSelectMenuInteraction,
	StringSelectMenuInteraction,
	UserSelectMenuInteraction,
} from '../structures';
import { resolvePartialEmoji } from '../structures/extra/functions';
import { BaseComponentBuilder, type OptionValuesLength } from './Base';

export type BuilderSelectMenus =
	| RoleSelectMenu
	| UserSelectMenu
	| MentionableSelectMenu
	| ChannelSelectMenu
	| StringSelectMenu;

/**
 * Maps default values for Select Menus.
 * @template T - The type of SelectMenuDefaultValueType.
 * @param ids - The IDs of items to be mapped as default.
 * @param type - The type of default values.
 * @returns An array of default values.
 */
function mappedDefault<T extends SelectMenuDefaultValueType>(
	ids: RestOrArray<string>,
	type: T,
): APISelectMenuDefaultValue<T>[] {
	return ids.flat().map(id => ({ id, type }));
}

/**
 * Represents a base class for building Select Menus.
 * @template Select - The type of APISelectMenuComponent.
 * @template Interaction - The type of interaction.
 * @example
 * const selectMenu = new SelectMenu<APIUserSelectComponent, UserSelectMenuInteraction>();
 * selectMenu.setCustomId("user-select-menu");
 * selectMenu.setPlaceholder("Select a user");
 * selectMenu.run((interaction) => {
 *   // Handle select menu interaction
 * });
 */
export class SelectMenu<
	Select extends APISelectMenuComponent = APISelectMenuComponent,
	//@ts-expect-error
	Interaction = ComponentInteraction,
> extends BaseComponentBuilder<Select> {
	/**
	 * Sets the custom ID for the select menu.
	 * @param id - The custom ID for the select menu.
	 * @returns The current SelectMenu instance.
	 */
	setCustomId(id: string): this {
		this.data.custom_id = id;
		return this;
	}

	/**
	 * Sets the placeholder text for the select menu.
	 * @param placeholder - The placeholder text.
	 * @returns The current SelectMenu instance.
	 */
	setPlaceholder(placeholder: string): this {
		this.data.placeholder = placeholder;
		return this;
	}

	/**
	 * Sets the maximum and minimum number of selected values for the select menu.
	 * @param options - The maximum and minimum values.
	 * @returns The current SelectMenu instance.
	 */
	setValuesLength({ max, min }: Partial<OptionValuesLength>): this {
		this.data.max_values = max;
		this.data.min_values = min;
		return this;
	}

	/**
	 * Sets whether the select menu is disabled.
	 *  [disabled=true] - Indicates whether the select menu is disabled.
	 * @returns The current SelectMenu instance.
	 */
	setDisabled(disabled = true): this {
		this.data.disabled = disabled;
		return this;
	}
}

/**
 * Represents a Select Menu for selecting users.
 * @example
 * const userSelectMenu = new UserSelectMenu();
 * userSelectMenu.setCustomId("user-select");
 * userSelectMenu.addDefaultUsers("123456789", "987654321");
 */
export class UserSelectMenu extends SelectMenu<APIUserSelectComponent, UserSelectMenuInteraction> {
	constructor(data: Partial<APIUserSelectComponent> = {}) {
		super({ ...data, type: ComponentType.UserSelect });
	}

	/**
	 * Adds default selected users to the select menu.
	 * @param users - User IDs to be added as default.
	 * @returns The current UserSelectMenu instance.
	 */
	addDefaultUsers(...users: RestOrArray<string>): this {
		this.data.default_values = (this.data.default_values ?? []).concat(
			mappedDefault(users, SelectMenuDefaultValueType.User),
		);
		return this;
	}

	/**
	 * Sets the default selected users for the select menu.
	 * @param users - User IDs to be set as default.
	 * @returns The current UserSelectMenu instance.
	 */
	setDefaultUsers(...users: RestOrArray<string>): this {
		this.data.default_values = mappedDefault(users, SelectMenuDefaultValueType.User);
		return this;
	}
}

/**
 * Represents a Select Menu for selecting roles.
 * @example
 * const roleSelectMenu = new RoleSelectMenu();
 * roleSelectMenu.setCustomId("role-select");
 * roleSelectMenu.addDefaultRoles("123456789", "987654321");
 */
export class RoleSelectMenu extends SelectMenu<APIRoleSelectComponent, RoleSelectMenuInteraction> {
	constructor(data: Partial<APIRoleSelectComponent> = {}) {
		super({ ...data, type: ComponentType.RoleSelect });
	}

	/**
	 * Adds default selected roles to the select menu.
	 * @param roles - Role IDs to be added as default.
	 * @returns The current RoleSelectMenu instance.
	 */
	addDefaultRoles(...roles: RestOrArray<string>): this {
		this.data.default_values = (this.data.default_values ?? []).concat(
			mappedDefault(roles, SelectMenuDefaultValueType.Role),
		);
		return this;
	}

	/**
	 * Sets the default selected roles for the select menu.
	 * @param roles - Role IDs to be set as default.
	 * @returns The current RoleSelectMenu instance.
	 */
	setDefaultRoles(...roles: RestOrArray<string>): this {
		this.data.default_values = mappedDefault(roles, SelectMenuDefaultValueType.Role);
		return this;
	}
}

export type MentionableDefaultElement = { id: string; type: keyof Omit<typeof SelectMenuDefaultValueType, 'Channel'> };

/**
 * Represents a Select Menu for selecting mentionable entities.
 * @example
 * const mentionableSelectMenu = new MentionableSelectMenu();
 * mentionableSelectMenu.setCustomId("mentionable-select");
 */
export class MentionableSelectMenu extends SelectMenu<APIMentionableSelectComponent, MentionableSelectMenuInteraction> {
	constructor(data: Partial<APIMentionableSelectComponent> = {}) {
		super({ ...data, type: ComponentType.MentionableSelect });
	}

	/**
	 * Sets the default selected roles or users for the select menu.
	 * @param mentionables - Role/User id and type to be set as default.
	 * @returns The current MentionableSelectMenu instance.
	 */
	setDefaultMentionables(...mentionables: RestOrArray<MentionableDefaultElement>) {
		this.data.default_values = mentionables.flat().map(mentionable => ({
			id: mentionable.id,
			type: SelectMenuDefaultValueType[mentionable.type],
		}));
		return this;
	}

	/**
	 * Adds default selected roles or users for the select menu.
	 * @param mentionables - Role/User id and type to be added as default.
	 * @returns The current MentionableSelectMenu instance.
	 */
	addDefaultMentionables(...mentionables: RestOrArray<MentionableDefaultElement>) {
		this.data.default_values = (this.data.default_values ?? []).concat(
			mentionables.flat().map(mentionable => ({
				id: mentionable.id,
				type: SelectMenuDefaultValueType[mentionable.type],
			})),
		);
		return this;
	}
}

/**
 * Represents a Select Menu for selecting channels.
 * @example
 * const channelSelectMenu = new ChannelSelectMenu();
 * channelSelectMenu.setCustomId("channel-select");
 * channelSelectMenu.addDefaultChannels("123456789", "987654321");
 * channelSelectMenu.setChannelTypes([ChannelType.GuildText, ChannelType.GuildVoice]);
 */
export class ChannelSelectMenu extends SelectMenu<APIChannelSelectComponent, ChannelSelectMenuInteraction> {
	constructor(data: Partial<APIChannelSelectComponent> = {}) {
		super({ ...data, type: ComponentType.ChannelSelect });
	}

	/**
	 * Adds default selected channels to the select menu.
	 * @param channels - Channel IDs to be added as default.
	 * @returns The current ChannelSelectMenu instance.
	 */
	addDefaultChannels(...channels: RestOrArray<string>): this {
		this.data.default_values = (this.data.default_values ?? []).concat(
			mappedDefault(channels, SelectMenuDefaultValueType.Channel),
		);
		return this;
	}

	/**
	 * Sets the default selected channels for the select menu.
	 * @param channels - Channel IDs to be set as default.
	 * @returns The current ChannelSelectMenu instance.
	 */
	setDefaultChannels(...channels: RestOrArray<string>): this {
		this.data.default_values = mappedDefault(channels, SelectMenuDefaultValueType.Channel);
		return this;
	}

	/**
	 * Sets the types of channels that can be selected in the menu.
	 *  types - The types of channels.
	 * @returns The current ChannelSelectMenu instance.
	 */
	setChannelTypes(types: ChannelType[]): this {
		this.data.channel_types = types;
		return this;
	}
}

/**
 * Represents a Select Menu for selecting string options.
 * @example
 * const stringSelectMenu = new StringSelectMenu();
 * stringSelectMenu.setCustomId("string-select");
 * stringSelectMenu.addOption(new StringSelectOption().setLabel("Option 1").setValue("option_1"));
 * stringSelectMenu.setOptions([
 *   { label: "Option 2", value: "option_2" },
 *   { label: "Option 3", value: "option_3" },
 * ]);
 */
export class StringSelectMenu extends (SelectMenu as unknown as ToClass<
	Omit<SelectMenu<APIStringSelectComponent, StringSelectMenuInteraction>, 'data' | 'toJSON'>,
	StringSelectMenu
>) {
	declare data: Omit<APIStringSelectComponent, 'options'> & { options: StringSelectOption[] };
	constructor(data: Partial<APIStringSelectComponent> = {}) {
		super({ ...data, type: ComponentType.StringSelect });
		this.data.options = (data.options ?? []).map(x => new StringSelectOption(x));
	}

	/**
	 * Adds options to the string select menu.
	 * @param options - Options to be added.
	 * @returns The current StringSelectMenu instance.
	 */
	addOption(...options: RestOrArray<StringSelectOption>): this {
		this.data.options = this.data.options.concat(options.flat());
		return this;
	}

	/**
	 * Sets the options for the string select menu.
	 *  options - Options to be set.
	 * @returns The current StringSelectMenu instance.
	 */
	setOptions(options: StringSelectOption[]): this {
		this.data.options = options;
		return this;
	}

	toJSON(): APIStringSelectComponent {
		const { options, ...raw } = this.data;
		return {
			...raw,
			options: this.data.options.map(x => x.toJSON()),
		};
	}
}

/**
 * Represents an individual option for a string select menu.
 * @example
 * const option = new StringSelectOption().setLabel("Option 1").setValue("option_1");
 */
export class StringSelectOption {
	constructor(public data: Partial<APISelectMenuOption> = {}) {}

	/**
	 * Sets the label for the option.
	 *  label - The label for the option.
	 * @returns The current StringSelectOption instance.
	 */
	setLabel(label: string): this {
		this.data.label = label;
		return this;
	}

	/**
	 * Sets the value for the option.
	 *  value - The value for the option.
	 * @returns The current StringSelectOption instance.
	 */
	setValue(value: string): this {
		this.data.value = value;
		return this;
	}

	/**
	 * Sets the description for the option.
	 *  description - The description for the option.
	 * @returns The current StringSelectOption instance.
	 */
	setDescription(description: string): this {
		this.data.description = description;
		return this;
	}

	/**
	 * Sets whether the option is the default.
	 *  [Default=true] - Indicates whether the option is the default.
	 * @returns The current StringSelectOption instance.
	 */
	setDefault(Default = true): this {
		this.data.default = Default;
		return this;
	}

	/**
	 * Sets the emoji for the option.
	 * @param emoji - The emoji to set.
	 * @returns The modified option instance.
	 */
	setEmoji(emoji: EmojiResolvable) {
		const resolve = resolvePartialEmoji(emoji);
		if (!resolve) return throwError('Invalid Emoji');
		this.data.emoji = resolve as APIMessageComponentEmoji;
		return this;
	}

	/**
	 * Converts the option to JSON format.
	 * @returns The option data in JSON format.
	 */
	toJSON(): APISelectMenuOption {
		return { ...this.data } as APISelectMenuOption;
	}
}
