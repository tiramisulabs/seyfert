import type { CacheFrom } from '../..';
import type { APIStageInstance } from '../../types';
import { GuildRelatedResource } from './default/guild-related';

export class StageInstances extends GuildRelatedResource<APIStageInstance, APIStageInstance> {
	namespace = 'stage_instance';

	// @ts-expect-error Keep descriptive filter parameter names for adapter overrides despite noUnusedParameters.
	filter(data: APIStageInstance, id: string, guild_id: string, from: CacheFrom) {
		return true;
	}
}
