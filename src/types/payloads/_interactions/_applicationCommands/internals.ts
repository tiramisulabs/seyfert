import type { Snowflake } from '../../../index';
import type { ApplicationCommandType } from '../applicationCommands';

export interface APIBaseApplicationCommandInteractionData<Type extends ApplicationCommandType> {
	id: Snowflake;
	type: Type;
	name: string;
	guild_id?: Snowflake;
}
