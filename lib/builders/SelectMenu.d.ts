import { type APIChannelSelectComponent, type APIMentionableSelectComponent, type APIRoleSelectComponent, type APISelectMenuComponent, type APISelectMenuOption, type APIStringSelectComponent, type APIUserSelectComponent, type ChannelType, SelectMenuDefaultValueType } from 'discord-api-types/v10';
import type { EmojiResolvable, RestOrArray, ToClass } from '../common';
import type { ChannelSelectMenuInteraction, ComponentInteraction, MentionableSelectMenuInteraction, RoleSelectMenuInteraction, StringSelectMenuInteraction, UserSelectMenuInteraction } from '../structures';
import { BaseComponentBuilder, type OptionValuesLength } from './Base';
export type BuilderSelectMenus = RoleSelectMenu | UserSelectMenu | MentionableSelectMenu | ChannelSelectMenu | StringSelectMenu;
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
export declare class SelectMenu<Select extends APISelectMenuComponent = APISelectMenuComponent, Interaction = ComponentInteraction> extends BaseComponentBuilder<Select> {
    /**
     * Sets the custom ID for the select menu.
     * @param id - The custom ID for the select menu.
     * @returns The current SelectMenu instance.
     */
    setCustomId(id: string): this;
    /**
     * Sets the placeholder text for the select menu.
     * @param placeholder - The placeholder text.
     * @returns The current SelectMenu instance.
     */
    setPlaceholder(placeholder: string): this;
    /**
     * Sets the maximum and minimum number of selected values for the select menu.
     * @param options - The maximum and minimum values.
     * @returns The current SelectMenu instance.
     */
    setValuesLength({ max, min }: Partial<OptionValuesLength>): this;
    /**
     * Sets whether the select menu is disabled.
     *  [disabled=true] - Indicates whether the select menu is disabled.
     * @returns The current SelectMenu instance.
     */
    setDisabled(disabled?: boolean): this;
}
/**
 * Represents a Select Menu for selecting users.
 * @example
 * const userSelectMenu = new UserSelectMenu();
 * userSelectMenu.setCustomId("user-select");
 * userSelectMenu.addDefaultUsers("123456789", "987654321");
 */
export declare class UserSelectMenu extends SelectMenu<APIUserSelectComponent, UserSelectMenuInteraction> {
    constructor(data?: Partial<APIUserSelectComponent>);
    /**
     * Adds default selected users to the select menu.
     * @param users - User IDs to be added as default.
     * @returns The current UserSelectMenu instance.
     */
    addDefaultUsers(...users: RestOrArray<string>): this;
    /**
     * Sets the default selected users for the select menu.
     * @param users - User IDs to be set as default.
     * @returns The current UserSelectMenu instance.
     */
    setDefaultUsers(...users: RestOrArray<string>): this;
}
/**
 * Represents a Select Menu for selecting roles.
 * @example
 * const roleSelectMenu = new RoleSelectMenu();
 * roleSelectMenu.setCustomId("role-select");
 * roleSelectMenu.addDefaultRoles("123456789", "987654321");
 */
export declare class RoleSelectMenu extends SelectMenu<APIRoleSelectComponent, RoleSelectMenuInteraction> {
    constructor(data?: Partial<APIRoleSelectComponent>);
    /**
     * Adds default selected roles to the select menu.
     * @param roles - Role IDs to be added as default.
     * @returns The current RoleSelectMenu instance.
     */
    addDefaultRoles(...roles: RestOrArray<string>): this;
    /**
     * Sets the default selected roles for the select menu.
     * @param roles - Role IDs to be set as default.
     * @returns The current RoleSelectMenu instance.
     */
    setDefaultRoles(...roles: RestOrArray<string>): this;
}
export type MentionableDefaultElement = {
    id: string;
    type: keyof Omit<typeof SelectMenuDefaultValueType, 'Channel'>;
};
/**
 * Represents a Select Menu for selecting mentionable entities.
 * @example
 * const mentionableSelectMenu = new MentionableSelectMenu();
 * mentionableSelectMenu.setCustomId("mentionable-select");
 */
export declare class MentionableSelectMenu extends SelectMenu<APIMentionableSelectComponent, MentionableSelectMenuInteraction> {
    constructor(data?: Partial<APIMentionableSelectComponent>);
    /**
     * Sets the default selected roles or users for the select menu.
     * @param mentionables - Role/User id and type to be set as default.
     * @returns The current MentionableSelectMenu instance.
     */
    setDefaultMentionables(...mentionables: RestOrArray<MentionableDefaultElement>): this;
    /**
     * Adds default selected roles or users for the select menu.
     * @param mentionables - Role/User id and type to be added as default.
     * @returns The current MentionableSelectMenu instance.
     */
    addDefaultMentionables(...mentionables: RestOrArray<MentionableDefaultElement>): this;
}
/**
 * Represents a Select Menu for selecting channels.
 * @example
 * const channelSelectMenu = new ChannelSelectMenu();
 * channelSelectMenu.setCustomId("channel-select");
 * channelSelectMenu.addDefaultChannels("123456789", "987654321");
 * channelSelectMenu.setChannelTypes([ChannelType.GuildText, ChannelType.GuildVoice]);
 */
export declare class ChannelSelectMenu extends SelectMenu<APIChannelSelectComponent, ChannelSelectMenuInteraction> {
    constructor(data?: Partial<APIChannelSelectComponent>);
    /**
     * Adds default selected channels to the select menu.
     * @param channels - Channel IDs to be added as default.
     * @returns The current ChannelSelectMenu instance.
     */
    addDefaultChannels(...channels: RestOrArray<string>): this;
    /**
     * Sets the default selected channels for the select menu.
     * @param channels - Channel IDs to be set as default.
     * @returns The current ChannelSelectMenu instance.
     */
    setDefaultChannels(...channels: RestOrArray<string>): this;
    /**
     * Sets the types of channels that can be selected in the menu.
     *  types - The types of channels.
     * @returns The current ChannelSelectMenu instance.
     */
    setChannelTypes(types: ChannelType[]): this;
}
declare const StringSelectMenu_base: ToClass<Omit<SelectMenu<APIStringSelectComponent, StringSelectMenuInteraction<string[]>>, "data" | "toJSON">, StringSelectMenu>;
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
export declare class StringSelectMenu extends StringSelectMenu_base {
    data: Omit<APIStringSelectComponent, 'options'> & {
        options: StringSelectOption[];
    };
    constructor(data?: Partial<APIStringSelectComponent>);
    /**
     * Adds options to the string select menu.
     * @param options - Options to be added.
     * @returns The current StringSelectMenu instance.
     */
    addOption(...options: RestOrArray<StringSelectOption>): this;
    /**
     * Sets the options for the string select menu.
     *  options - Options to be set.
     * @returns The current StringSelectMenu instance.
     */
    setOptions(options: StringSelectOption[]): this;
    toJSON(): APIStringSelectComponent;
}
/**
 * Represents an individual option for a string select menu.
 * @example
 * const option = new StringSelectOption().setLabel("Option 1").setValue("option_1");
 */
export declare class StringSelectOption {
    data: Partial<APISelectMenuOption>;
    constructor(data?: Partial<APISelectMenuOption>);
    /**
     * Sets the label for the option.
     *  label - The label for the option.
     * @returns The current StringSelectOption instance.
     */
    setLabel(label: string): this;
    /**
     * Sets the value for the option.
     *  value - The value for the option.
     * @returns The current StringSelectOption instance.
     */
    setValue(value: string): this;
    /**
     * Sets the description for the option.
     *  description - The description for the option.
     * @returns The current StringSelectOption instance.
     */
    setDescription(description: string): this;
    /**
     * Sets whether the option is the default.
     *  [Default=true] - Indicates whether the option is the default.
     * @returns The current StringSelectOption instance.
     */
    setDefault(Default?: boolean): this;
    /**
     * Sets the emoji for the option.
     * @param emoji - The emoji to set.
     * @returns The modified option instance.
     */
    setEmoji(emoji: EmojiResolvable): this;
    /**
     * Converts the option to JSON format.
     * @returns The option data in JSON format.
     */
    toJSON(): APISelectMenuOption;
}
export {};
