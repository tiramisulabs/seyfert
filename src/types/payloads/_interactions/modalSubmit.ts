import type { Snowflake } from '../..';

import type {
	APIActionRowComponent,
	APIAttachment,
	APIBaseInteraction,
	APIDMInteractionWrapper,
	APIGuildInteractionWrapper,
	APIModalActionRowComponent,
	ComponentType,
	InteractionType,
} from '../index';

export interface ModalSubmitComponent {
	type: ComponentType;
	custom_id: string;
	value?: string;
	values?: string[];
}

export interface ModalSubmitActionRowComponent
	extends Omit<APIActionRowComponent<APIModalActionRowComponent>, 'components'> {
	component?: ModalSubmitComponent;
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
	components: ModalSubmitActionRowComponent[];
	/**
	 * Resolved data structure
	 */
	resolved?: {
		/**
		 * A map of attachments
		 */
		attachments: Record<Snowflake, Omit<APIAttachment, 'duration_secs' | 'waveform'>>;
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
