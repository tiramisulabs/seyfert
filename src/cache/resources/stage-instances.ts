import type { APIStageInstance } from 'discord-api-types/v10';
import { GuildRelatedResource } from './default/guild-related';

export class StageInstances extends GuildRelatedResource<APIStageInstance> {
	namespace = 'stage_instances';
}
