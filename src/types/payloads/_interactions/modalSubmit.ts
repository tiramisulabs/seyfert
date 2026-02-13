import type { Snowflake } from '../..';

import type {
	APIAttachment,
	APIBaseInteraction,
	APIDMInteractionWrapper,
	APIGuildInteractionWrapper,
	APIInteractionDataResolvedChannel,
	APIInteractionDataResolvedGuildMember,
	APILabelComponents,
	APIRole,
	APIUser,
	ComponentType,
	InteractionType,
} from '../index';

export interface ModalSubmitComponent {
	type: APILabelComponents['type'];
	id?: number;
	custom_id: string;
}

export interface ModalSubmitFileUploadData extends ModalSubmitComponent {
	type: ComponentType.FileUpload;
	values: string[];
}

export type ModalSubmitFileUpload = ModalSubmitInsideLabel<ModalSubmitFileUploadData>;
export interface ModalSubmitRadioGroupData extends ModalSubmitComponent {
	type: ComponentType.RadioGroup;
	value: string;
}

export type ModalSubmitRadioGroup = ModalSubmitInsideLabel<ModalSubmitRadioGroupData>;

export interface ModalSubmitCheckboxGroupData extends ModalSubmitComponent {
	type: ComponentType.CheckboxGroup;
	values: string[];
}

export type ModalSubmitCheckboxGroup = ModalSubmitInsideLabel<ModalSubmitCheckboxGroupData>;

export interface ModalSubmitCheckboxData extends ModalSubmitComponent {
	type: ComponentType.Checkbox;
	value: boolean;
}

export type ModalSubmitCheckbox = ModalSubmitInsideLabel<ModalSubmitCheckboxData>;

export interface ModalSubmitTextInputData extends ModalSubmitComponent {
	type: ComponentType.TextInput;
	value: string;
}

export type ModalSubmitTextInput = ModalSubmitInsideLabel<ModalSubmitTextInputData>;

export interface ModalSubmitSelectMenuData extends ModalSubmitComponent {
	type:
		| ComponentType.StringSelect
		| ComponentType.UserSelect
		| ComponentType.RoleSelect
		| ComponentType.MentionableSelect
		| ComponentType.ChannelSelect;
	values: string[];
}

export type ModalSubmitSelectMenu = ModalSubmitInsideLabel<ModalSubmitSelectMenuData>;

export type ModalSubmitInsideLabelData =
	| ModalSubmitRadioGroupData
	| ModalSubmitCheckboxGroupData
	| ModalSubmitCheckboxData
	| ModalSubmitTextInputData
	| ModalSubmitSelectMenuData
	| ModalSubmitFileUploadData;
export interface ModalSubmitInsideLabel<C extends ModalSubmitInsideLabelData = ModalSubmitInsideLabelData> {
	type: ComponentType.Label;
	id?: number;
	component?: C;
}

/**
 * https://discord.com/developers/docs/interactions/receiving-and-responding#interaction-object-modal-submit-data-structure
 */
export interface APIModalSubmission {
	/**
	 * A developer-defined identifier for the component, max 100 characters
	 */
	custom_id: string;
	/**
	 * A list of child components
	 */
	components: ModalSubmitInsideLabel[];
	/**
	 * Resolved data structure
	 */
	resolved?: {
		/**
		 * A map of attachments
		 */
		attachments?: Record<Snowflake, Omit<APIAttachment, 'duration_secs' | 'waveform'>>;
		/**
		 * A map of members
		 */
		members?: Record<Snowflake, APIInteractionDataResolvedGuildMember>;
		/**
		 * A map of roles
		 */
		roles?: Record<Snowflake, APIRole>;
		/**
		 * A map of users
		 */
		users?: Record<Snowflake, APIUser>;
		/**
		 * A map of channels
		 */
		channels?: Record<Snowflake, APIInteractionDataResolvedChannel>;
	};
}

/**
 * https://discord.com/developers/docs/interactions/receiving-and-responding#interaction-object
 */
export type APIModalSubmitInteraction = APIBaseInteraction<InteractionType.ModalSubmit, APIModalSubmission> &
	Required<Pick<APIBaseInteraction<InteractionType.ModalSubmit, APIModalSubmission>, 'data'>>;

/**
 * https://discord.com/developers/docs/interactions/receiving-and-responding#interaction-object
 */
export type APIModalSubmitDMInteraction = APIDMInteractionWrapper<APIModalSubmitInteraction>;

/**
 * https://discord.com/developers/docs/interactions/receiving-and-responding#interaction-object
 */
export type APIModalSubmitGuildInteraction = APIGuildInteractionWrapper<APIModalSubmitInteraction>;
