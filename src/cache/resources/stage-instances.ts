import type { APIStageInstance } from 'discord-api-types/v10';
import { GuildRelatedResource } from './default/guild-related';

export class StageInstances extends GuildRelatedResource<APIStageInstance, APIStageInstance> {
	namespace = 'stage_instance';

	//@ts-expect-error
	filter(data: APIStageInstance, id: string, guild_id?: string) {
		return true;
	}
}
