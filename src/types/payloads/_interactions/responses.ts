import type { MakeRequired } from '../../../common';
import type { RESTPostAPIWebhookWithTokenJSONBody } from '../../index';
import type { APIActionRowComponent, APIModalActionRowComponent } from '../channel';
import type { MessageFlags } from '../index';
import type { APIApplicationCommandOptionChoice } from './applicationCommands';

/**
 * https://discord.com/developers/docs/interactions/receiving-and-responding#interaction-object-interaction-type
 */
export enum InteractionType {
	Ping = 1,
	ApplicationCommand,
	MessageComponent,
	ApplicationCommandAutocomplete,
	ModalSubmit,
}

/**
 * https://discord.com/developers/docs/interactions/receiving-and-responding#interaction-response-object
 */
export type APIInteractionResponse =
	| APIApplicationCommandAutocompleteResponse
	| APIInteractionResponseChannelMessageWithSource
	| APIInteractionResponseDeferredChannelMessageWithSource
	| APIInteractionResponseDeferredMessageUpdate
	| APIInteractionResponsePong
	| APIInteractionResponseUpdateMessage
	| APIModalInteractionResponse
	| APIInteractionResponseLaunchActivity;

export interface APIInteractionResponsePong {
	type: InteractionResponseType.Pong;
}

export interface APIApplicationCommandAutocompleteResponse {
	type: InteractionResponseType.ApplicationCommandAutocompleteResult;
	data: APICommandAutocompleteInteractionResponseCallbackData;
}

export interface APIModalInteractionResponse {
	type: InteractionResponseType.Modal;
	data: APIModalInteractionResponseCallbackData;
}

export interface APIInteractionResponseChannelMessageWithSource {
	type: InteractionResponseType.ChannelMessageWithSource;
	data: APIInteractionResponseCallbackData;
}

export interface APIInteractionResponseDeferredChannelMessageWithSource {
	type: InteractionResponseType.DeferredChannelMessageWithSource;
	data?: Pick<APIInteractionResponseCallbackData, 'flags'>;
}

export interface APIInteractionResponseDeferredMessageUpdate {
	type: InteractionResponseType.DeferredMessageUpdate;
}

export interface APIInteractionResponseUpdateMessage {
	type: InteractionResponseType.UpdateMessage;
	data?: APIInteractionResponseCallbackData;
}

export interface APIInteractionResponseLaunchActivity {
	type: InteractionResponseType.LaunchActivity;
}

/**
 * https://discord.com/developers/docs/interactions/receiving-and-responding#interaction-response-object-interaction-callback-type
 */
export enum InteractionResponseType {
	/**
	 * ACK a `Ping`
	 */
	Pong = 1,
	/**
	 * Respond to an interaction with a message
	 */
	ChannelMessageWithSource = 4,
	/**
	 * ACK an interaction and edit to a response later, the user sees a loading state
	 */
	DeferredChannelMessageWithSource,
	/**
	 * ACK a button interaction and update it to a loading state
	 */
	DeferredMessageUpdate,
	/**
	 * ACK a button interaction and edit the message to which the button was attached
	 */
	UpdateMessage,
	/**
	 * For autocomplete interactions
	 */
	ApplicationCommandAutocompleteResult,
	/**
	 * Respond to an interaction with an modal for a user to fill-out
	 */
	Modal,
	/**
	 * Launch the Activity associated with the app. Only available for apps with Activities enabled
	 */
	LaunchActivity = 12,
}

/**
 * https://discord.com/developers/docs/interactions/receiving-and-responding#interaction-response-object-interaction-callback-data-structure
 */
export type APIInteractionResponseCallbackData = Omit<
	RESTPostAPIWebhookWithTokenJSONBody,
	'avatar_url' | 'username'
> & { flags?: MessageFlags };

export interface APICommandAutocompleteInteractionResponseCallbackData {
	choices?: APIApplicationCommandOptionChoice[];
}

/**
 * https://discord.com/developers/docs/interactions/receiving-and-responding#interaction-response-object-modal
 */
export interface APIModalInteractionResponseCallbackData {
	/**
	 * A developer-defined identifier for the component, max 100 characters
	 */
	custom_id: string;
	/**
	 * The title of the popup modal
	 */
	title: string;
	/**
	 * Between 1 and 5 (inclusive) components that make up the modal
	 */
	components: APIActionRowComponent<APIModalActionRowComponent>[];
}

/**
 * https://discord.com/developers/docs/interactions/receiving-and-responding#interaction-callback-interaction-callback-object
 */
export interface InteractionCallbackData<T extends InteractionType = InteractionType> {
	id: string;
	type: T;
	/**
	 * Instance ID of the Activity if one was launched or joined
	 */
	activity_instance_id?: string;
	/**
	 * ID of the message that was created by the interaction
	 */
	response_message_id?: string;
	/**
	 * Whether or not the message is in a loading state
	 */
	response_message_loading?: boolean;
	/**
	 * Whether or not the response message was ephemeral
	 */
	response_message_ephemeral?: boolean;
}

/**
 * https://discord.com/developers/docs/interactions/receiving-and-responding#interaction-callback-interaction-callback-resource-object
 */
export interface InteractionCallbackResourceActivity {
	/**
	 * 	Instance ID of the Activity if one was launched or joined.
	 */
	id: string;
}

/**
 * https://discord.com/developers/docs/interactions/receiving-and-responding#interaction-callback-interaction-callback-activity-instance-resource
 */
export interface InteractionCallbackResource<T extends InteractionResponseType = InteractionResponseType> {
	type: T;
	/**
	 * 	Represents the Activity launched by this interaction.
	 */
	activity_instance?: InteractionCallbackResourceActivity;
	/**
	 * Message created by the interaction.
	 */
	message?: Omit<RESTPostAPIWebhookWithTokenJSONBody, 'avatar_url' | 'username'> & { flags?: MessageFlags };
}

/**
 * https://discord.com/developers/docs/interactions/receiving-and-responding#interaction-callback-interaction-callback-response-object
 */
export interface InteractionCallbackResponse {
	interaction: InteractionCallbackData;
	resource?: InteractionCallbackResource;
}

/**
 * https://discord.com/developers/docs/interactions/receiving-and-responding#interaction-callback-interaction-callback-response-object
 */
export type APIInteractionCallbackLaunchActivity = InteractionCallbackResponse & {
	resource?: Omit<MakeRequired<InteractionCallbackResource, 'activity_instance'>, 'message'>;
};

export type APIInteractionCallbackMessage = InteractionCallbackResponse & {
	resource?: Omit<MakeRequired<InteractionCallbackResource, 'message'>, 'activity_instance'>;
};
