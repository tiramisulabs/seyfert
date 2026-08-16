import type { Snowflake } from '../../../index';
import type { APIMessage } from '../../channel';
import type { APIApplicationCommandInteractionWrapper, ApplicationCommandType } from '../applicationCommands';
import type { APIDMInteractionWrapper, APIGuildInteractionWrapper, APIUserInteractionDataResolved } from '../base';
import type { APIBaseApplicationCommandInteractionData } from './internals';

/**
 * https://docs.discord.com/developers/interactions/receiving-and-responding#interaction-object-interaction-data
 */
export interface APIUserApplicationCommandInteractionData
	extends APIBaseApplicationCommandInteractionData<ApplicationCommandType.User> {
	target_id: Snowflake;
	resolved: APIUserInteractionDataResolved;
}

/**
 * https://docs.discord.com/developers/interactions/receiving-and-responding#interaction-object-interaction-data
 */
export interface APIMessageApplicationCommandInteractionData
	extends APIBaseApplicationCommandInteractionData<ApplicationCommandType.Message> {
	target_id: Snowflake;
	resolved: APIMessageApplicationCommandInteractionDataResolved;
}

/**
 * https://docs.discord.com/developers/interactions/receiving-and-responding#interaction-object-resolved-data-structure
 */
export interface APIMessageApplicationCommandInteractionDataResolved {
	messages: Record<Snowflake, APIMessage>;
}

/**
 * https://docs.discord.com/developers/interactions/receiving-and-responding#interaction-object-interaction-data
 */
export type APIContextMenuInteractionData =
	| APIMessageApplicationCommandInteractionData
	| APIUserApplicationCommandInteractionData;

/**
 * https://docs.discord.com/developers/interactions/receiving-and-responding#interaction-object
 */
export type APIUserApplicationCommandInteraction =
	APIApplicationCommandInteractionWrapper<APIUserApplicationCommandInteractionData>;

/**
 * https://docs.discord.com/developers/interactions/receiving-and-responding#interaction-object
 */
export type APIUserApplicationCommandDMInteraction = APIDMInteractionWrapper<APIUserApplicationCommandInteraction>;

/**
 * https://docs.discord.com/developers/interactions/receiving-and-responding#interaction-object
 */
export type APIUserApplicationCommandGuildInteraction =
	APIGuildInteractionWrapper<APIUserApplicationCommandInteraction>;

/**
 * https://docs.discord.com/developers/interactions/receiving-and-responding#interaction-object
 */
export type APIMessageApplicationCommandInteraction =
	APIApplicationCommandInteractionWrapper<APIMessageApplicationCommandInteractionData>;

/**
 * https://docs.discord.com/developers/interactions/receiving-and-responding#interaction-object
 */
export type APIMessageApplicationCommandDMInteraction =
	APIDMInteractionWrapper<APIMessageApplicationCommandInteraction>;

/**
 * https://docs.discord.com/developers/interactions/receiving-and-responding#interaction-object
 */
export type APIMessageApplicationCommandGuildInteraction =
	APIGuildInteractionWrapper<APIMessageApplicationCommandInteraction>;

/**
 * https://docs.discord.com/developers/interactions/receiving-and-responding#interaction-object
 */
export type APIContextMenuInteraction = APIMessageApplicationCommandInteraction | APIUserApplicationCommandInteraction;

/**
 * https://docs.discord.com/developers/interactions/receiving-and-responding#interaction-object
 */
export type APIContextMenuDMInteraction =
	| APIMessageApplicationCommandDMInteraction
	| APIUserApplicationCommandDMInteraction;

/**
 * https://docs.discord.com/developers/interactions/receiving-and-responding#interaction-object
 */
export type APIContextMenuGuildInteraction =
	| APIMessageApplicationCommandGuildInteraction
	| APIUserApplicationCommandGuildInteraction;
