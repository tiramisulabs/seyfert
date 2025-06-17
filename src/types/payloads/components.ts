import type { Identify, MakeRequired } from '../../common';
import type { APIAttachment, Snowflake } from '..';
import type { ChannelType } from '../utils';

/**
 * https://discord.com/developers/docs/interactions/message-components#component-object
 */
export interface APIBaseComponent<T extends ComponentType> {
	/**
	 * The type of the component
	 */
	type: T;
}

/**
 * https://discord.com/developers/docs/interactions/message-components#component-object-component-types
 */
export enum ComponentType {
	/**
	 * Action Row component
	 */
	ActionRow = 1,
	/**
	 * Button component
	 */
	Button,
	/**
	 * Select menu for picking from defined text options
	 */
	StringSelect,
	/**
	 * Text Input component
	 */
	TextInput,
	/**
	 * Select menu for users
	 */
	UserSelect,
	/**
	 * Select menu for roles
	 */
	RoleSelect,
	/**
	 * Select menu for users and roles
	 */
	MentionableSelect,
	/**
	 * Select menu for channels
	 */
	ChannelSelect,
	/**
	 * Section for accessory
	 */
	Section,
	/**
	 * Text display component
	 */
	TextDisplay,
	/**
	 * Thumbnail component
	 */
	Thumbnail,
	/**
	 * Media Gallery component
	 */
	MediaGallery,
	/**
	 * File component
	 */
	File,
	/**
	 * Separator component
	 */
	Separator,
	/**
	 * Container component
	 */
	Container = 17,
}

/**
 * https://discord.com/developers/docs/interactions/message-components#action-rows
 */
export interface APIActionRowComponent<T extends APIActionRowComponentTypes>
	extends APIBaseComponent<ComponentType.ActionRow> {
	/**
	 * The components in the ActionRow
	 */
	components: T[];
}

/**
 * https://discord.com/developers/docs/interactions/message-components#buttons
 */
export interface APIButtonComponentBase<Style extends ButtonStyle> extends APIBaseComponent<ComponentType.Button> {
	/**
	 * The label to be displayed on the button
	 */
	label?: string;
	/**
	 * The style of the button
	 */
	style: Style;
	/**
	 * The emoji to display to the left of the text
	 */
	emoji?: APIMessageComponentEmoji;
	/**
	 * The status of the button
	 */
	disabled?: boolean;
}

export interface APIMessageComponentEmoji {
	/**
	 * Emoji id
	 */
	id?: Snowflake;
	/**
	 * Emoji name
	 */
	name?: string;
	/**
	 * Whether this emoji is animated
	 */
	animated?: boolean;
}

export interface APIButtonComponentWithCustomId
	extends APIButtonComponentBase<
		ButtonStyle.Danger | ButtonStyle.Primary | ButtonStyle.Secondary | ButtonStyle.Success
	> {
	/**
	 * The custom_id to be sent in the interaction when clicked
	 */
	custom_id: string;
}

export interface APIButtonComponentWithURL extends APIButtonComponentBase<ButtonStyle.Link> {
	/**
	 * The URL to direct users to when clicked for Link buttons
	 */
	url: string;
}

export interface APIButtonComponentWithSKUId
	extends Omit<APIButtonComponentBase<ButtonStyle.Premium>, 'custom_id' | 'emoji' | 'label'> {
	/**
	 * The id for a purchasable SKU
	 */
	sku_id: Snowflake;
}

export type APIButtonComponent =
	| APIButtonComponentWithCustomId
	| APIButtonComponentWithSKUId
	| APIButtonComponentWithURL;

/**
 * https://discord.com/developers/docs/interactions/message-components#button-object-button-styles
 */
export enum ButtonStyle {
	Primary = 1,
	Secondary,
	Success,
	Danger,
	Link,
	Premium,
}

/**
 * https://discord.com/developers/docs/interactions/message-components#text-inputs-text-input-styles
 */
export enum TextInputStyle {
	Short = 1,
	Paragraph,
}

/**
 * https://discord.com/developers/docs/interactions/message-components#select-menus
 */
export interface APIBaseSelectMenuComponent<
	T extends
		| ComponentType.ChannelSelect
		| ComponentType.MentionableSelect
		| ComponentType.RoleSelect
		| ComponentType.StringSelect
		| ComponentType.UserSelect,
> extends APIBaseComponent<T> {
	/**
	 * A developer-defined identifier for the select menu, max 100 characters
	 */
	custom_id: string;
	/**
	 * Custom placeholder text if nothing is selected, max 150 characters
	 */
	placeholder?: string;
	/**
	 * The minimum number of items that must be chosen; min 0, max 25
	 *
	 * @default 1
	 */
	min_values?: number;
	/**
	 * The maximum number of items that can be chosen; max 25
	 *
	 * @default 1
	 */
	max_values?: number;
	/**
	 * Disable the select
	 *
	 * @default false
	 */
	disabled?: boolean;
}

export interface APIBaseAutoPopulatedSelectMenuComponent<
	T extends
		| ComponentType.ChannelSelect
		| ComponentType.MentionableSelect
		| ComponentType.RoleSelect
		| ComponentType.UserSelect,
	D extends SelectMenuDefaultValueType,
> extends APIBaseSelectMenuComponent<T> {
	/**
	 * List of default values for auto-populated select menu components
	 */
	default_values?: APISelectMenuDefaultValue<D>[];
}

/**
 * https://discord.com/developers/docs/interactions/message-components#select-menus
 */
export interface APIStringSelectComponent extends APIBaseSelectMenuComponent<ComponentType.StringSelect> {
	/**
	 * Specified choices in a select menu; max 25
	 */
	options: APISelectMenuOption[];
}

/**
 * https://discord.com/developers/docs/interactions/message-components#select-menus
 */
export type APIUserSelectComponent = APIBaseAutoPopulatedSelectMenuComponent<
	ComponentType.UserSelect,
	SelectMenuDefaultValueType.User
>;

/**
 * https://discord.com/developers/docs/interactions/message-components#select-menus
 */
export type APIRoleSelectComponent = APIBaseAutoPopulatedSelectMenuComponent<
	ComponentType.RoleSelect,
	SelectMenuDefaultValueType.Role
>;

/**
 * https://discord.com/developers/docs/interactions/message-components#select-menus
 */
export type APIMentionableSelectComponent = APIBaseAutoPopulatedSelectMenuComponent<
	ComponentType.MentionableSelect,
	SelectMenuDefaultValueType
>;

/**
 * https://discord.com/developers/docs/interactions/message-components#select-menus
 */
export interface APIChannelSelectComponent
	extends APIBaseAutoPopulatedSelectMenuComponent<ComponentType.ChannelSelect, SelectMenuDefaultValueType.Channel> {
	/**
	 * List of channel types to include in the ChannelSelect component
	 */
	channel_types?: ChannelType[];
}

/**
 * https://discord.com/developers/docs/interactions/message-components#select-menu-object-select-default-value-structure
 */
export enum SelectMenuDefaultValueType {
	Channel = 'channel',
	Role = 'role',
	User = 'user',
}

/**
 * https://discord.com/developers/docs/interactions/message-components#select-menu-object-select-default-value-structure
 */
export interface APISelectMenuDefaultValue<T extends SelectMenuDefaultValueType> {
	type: T;
	id: Snowflake;
}

export type APIAutoPopulatedSelectMenuComponent =
	| APIChannelSelectComponent
	| APIMentionableSelectComponent
	| APIRoleSelectComponent
	| APIUserSelectComponent;

/**
 * https://discord.com/developers/docs/interactions/message-components#select-menus
 */
export type APISelectMenuComponent =
	| APIChannelSelectComponent
	| APIMentionableSelectComponent
	| APIRoleSelectComponent
	| APIStringSelectComponent
	| APIUserSelectComponent;

/**
 * https://discord.com/developers/docs/interactions/message-components#select-menu-object-select-option-structure
 */
export interface APISelectMenuOption {
	/**
	 * The user-facing name of the option (max 100 chars)
	 */
	label: string;
	/**
	 * The dev-defined value of the option (max 100 chars)
	 */
	value: string;
	/**
	 * An additional description of the option (max 100 chars)
	 */
	description?: string;
	/**
	 * The emoji to display to the left of the option
	 */
	emoji?: APIMessageComponentEmoji;
	/**
	 * Whether this option should be already-selected by default
	 */
	default?: boolean;
}

/**
 * https://discord.com/developers/docs/interactions/message-components#text-inputs-text-input-structure
 */
export interface APITextInputComponent extends APIBaseComponent<ComponentType.TextInput> {
	/**
	 * One of text input styles
	 */
	style: TextInputStyle;
	/**
	 * The custom id for the text input
	 */
	custom_id: string;
	/**
	 * Text that appears on top of the text input field, max 45 characters
	 */
	label: string;
	/**
	 * Placeholder for the text input
	 */
	placeholder?: string;
	/**
	 * The pre-filled text in the text input
	 */
	value?: string;
	/**
	 * Minimal length of text input
	 */
	min_length?: number;
	/**
	 * Maximal length of text input
	 */
	max_length?: number;
	/**
	 * Whether or not this text input is required or not
	 */
	required?: boolean;
}

/**
 * https://discord.com/developers/docs/resources/channel#channel-object-channel-flags
 */
export enum ChannelFlags {
	/**
	 * @unstable This channel flag is currently not documented by Discord but has a known value which we will try to keep up to date.
	 */
	GuildFeedRemoved = 1 << 0,
	/**
	 * This thread is pinned to the top of its parent forum channel
	 */
	Pinned = 1 << 1,
	/**
	 * @unstable This channel flag is currently not documented by Discord but has a known value which we will try to keep up to date.
	 */
	ActiveChannelsRemoved = 1 << 2,
	/**
	 * Whether a tag is required to be specified when creating a thread in a forum channel.
	 * Tags are specified in the `applied_tags` field
	 */
	RequireTag = 1 << 4,
	/**
	 * @unstable This channel flag is currently not documented by Discord but has a known value which we will try to keep up to date.
	 */
	IsSpam = 1 << 5,
	/**
	 * @unstable This channel flag is currently not documented by Discord but has a known value which we will try to keep up to date.
	 */
	IsGuildResourceChannel = 1 << 7,
	/**
	 * @unstable This channel flag is currently not documented by Discord but has a known value which we will try to keep up to date.
	 */
	ClydeAI = 1 << 8,
	/**
	 * @unstable This channel flag is currently not documented by Discord but has a known value which we will try to keep up to date.
	 */
	IsScheduledForDeletion = 1 << 9,
	/**
	 * Whether media download options are hidden.
	 */
	HideMediaDownloadOptions = 1 << 15,
}

/**
 * https://discord.com/developers/docs/interactions/message-components#message-components
 */
export type APIMessageComponent = APIActionRowComponent<APIMessageActionRowComponent> | APIMessageActionRowComponent;
export type APIModalComponent = APIActionRowComponent<APIModalActionRowComponent> | APIModalActionRowComponent;

export type APIActionRowComponentTypes = APIMessageActionRowComponent | APIModalActionRowComponent;

/**
 * https://discord.com/developers/docs/interactions/message-components#message-components
 */
export type APIMessageActionRowComponent = APIButtonComponent | APISelectMenuComponent;

export type APIComponents =
	| APIMessageActionRowComponent
	| APIModalActionRowComponent
	| APIContainerComponent
	| APIContainerComponents
	| APITopLevelComponent;

// Modal components
export type APIModalActionRowComponent = APITextInputComponent;

/**
 * https://discord.com/developers/docs/components/reference#section
 *
 * A Section is a top-level layout component that allows you to join text contextually with an accessory.
 */
export interface APISectionComponent {
	/** 9 for section component */
	type: ComponentType.Section;
	/** Optional identifier for component */
	id?: number;
	/**	One to three text components */
	components: APITextDisplayComponent[];
	/** A thumbnail or a button component, with a future possibility of adding more compatible components */
	accessory: APIButtonComponent | APIThumbnailComponent;
}

/**
 * https://discord.com/developers/docs/components/reference#text-display
 *
 * A Text Display is a top-level content component that allows you to add text to your message formatted with markdown and mention users and roles. This is similar to the content field of a message, but allows you to add multiple text components, controlling the layout of your message.
 * Text Displays are only available in messages.
 */
export interface APITextDisplayComponent {
	/**	10 for text display */
	type: ComponentType.TextDisplay;
	/** Optional identifier for component */
	id?: number;
	/** Text that will be displayed similar to a message */
	content: string;
}

/**
 * https://discord.com/developers/docs/components/reference#thumbnail
 *
 * A Thumbnail is a content component that is a small image only usable as an accessory in a section. The preview comes from an url or attachment through the unfurled media item structure.
 * Thumbnails are only available in messages as an accessory in a section.
 */
export interface APIThumbnailComponent {
	/**	11 for thumbnail */
	type: ComponentType.Thumbnail;
	/** Optional identifier for component */
	id?: number;
	/**	A url or attachment */
	media: APIUnfurledMediaItem;
	/** Alt text for the media */
	description?: string;
	/** Whether the thumbnail should be a spoiler (or blurred out). Defaults to false */
	spoiler?: boolean;
}

/**
 * https://discord.com/developers/docs/components/reference#media-gallery
 *
 * A Media Gallery is a top-level content component that allows you to display 1-10 media attachments in an organized gallery format. Each item can have optional descriptions and can be marked as spoilers.
 * Media Galleries are only available in messages.
 */
export interface APIMediaGalleryComponent {
	/** 12 for media gallery */
	type: ComponentType.MediaGallery;
	/** Optional identifier for component */
	id?: number;
	/** 1 to 10 media gallery items */
	items: APIMediaGalleryItems[];
}

export interface APIMediaGalleryItems {
	/** A url or attachment */
	media: APIUnfurledMediaItem;
	/** Alt text for the media */
	description?: string;
	/** Whether the thumbnail should be a spoiler (or blurred out). Defaults to false */
	spoiler?: boolean;
}

/**
 * https://discord.com/developers/docs/components/reference#file
 *
 * A File is a top-level component that allows you to display an uploaded file as an attachment to the message and reference it in the component. Each file component can only display 1 attached file, but you can upload multiple files and add them to different file components within your payload. This is similar to the embeds field of a message but allows you to control the layout of your message by using this anywhere as a component.
 * Files are only available in messages.
 */
export interface APIFileComponent {
	/** 13 for file */
	type: ComponentType.File;
	/** Optional identifier for component */
	id?: number;
	/** This unfurled media item is unique in that it only supports attachment references using the attachment://<filename> syntax */
	file: APIUnfurledMediaItem;
	/** Whether the media should be a spoiler (or blurred out). Defaults to false */
	spoiler?: boolean;
}

/**
 * https://discord.com/developers/docs/components/reference#separator
 *
 * A Separator is a top-level layout component that adds vertical padding and visual division between other components.
 */
export interface APISeparatorComponent {
	/** 14 for separator */
	type: ComponentType.Separator;
	/** Optional identifier for component */
	id?: number;
	/** Whether a visual divider should be displayed in the component. Defaults to true */
	divider?: boolean;
	/** Size of separator padding—1 for small padding, 2 for large padding. Defaults to 1 */
	spacing?: Spacing;
}

export enum Spacing {
	/** For small padding */
	Small = 1,
	/** For large padding */
	Large,
}

export type APIContainerComponents =
	| APIActionRowComponent<APIActionRowComponentTypes>
	| APITextDisplayComponent
	| APISectionComponent
	| APIMediaGalleryComponent
	| APIFileComponent
	| APISeparatorComponent
	| APIThumbnailComponent;

/**
 * https://discord.com/developers/docs/components/reference#container
 */
export interface APIContainerComponent {
	/** 15 for container */
	type: ComponentType.Container;
	/** Optional identifier for component */
	id?: number;
	/** Up to 10 components of the type action row, text display, section, media gallery, separator, or file */
	components: APIContainerComponents[];
	/** Color for the accent on the container as RGB from 0x000000 to 0xFFFFFF */
	accent_color?: number;
	/** Whether the container should be a spoiler (or blurred out). Defaults to false. */
	spoiler?: boolean;
}

/**
 * https://discord.com/developers/docs/components/reference#unfurled-media-item-structure
 */
export interface APIUnfurledMediaItem
	extends Identify<
		MakeRequired<Partial<Pick<APIAttachment, 'url' | 'proxy_url' | 'height' | 'width' | 'content_type'>>, 'url'>
	> {}

export type APITopLevelComponent =
	| APIContainerComponent
	| APIActionRowComponent<APIActionRowComponentTypes>
	| APIFileComponent
	| APIMediaGalleryComponent
	| APISectionComponent
	| APISeparatorComponent
	| APITextDisplayComponent;
