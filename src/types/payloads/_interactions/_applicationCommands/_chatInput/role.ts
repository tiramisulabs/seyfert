import type { Snowflake } from '../../../../index';
import type { APIApplicationCommandOptionBase, APIInteractionDataOptionBase } from './base';
import type { ApplicationCommandOptionType } from './shared';

export type APIApplicationCommandRoleOption = APIApplicationCommandOptionBase<ApplicationCommandOptionType.Role>;

export type APIApplicationCommandInteractionDataRoleOption = APIInteractionDataOptionBase<
	ApplicationCommandOptionType.Role,
	Snowflake
>;
