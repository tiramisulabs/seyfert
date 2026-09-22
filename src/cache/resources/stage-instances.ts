import type { CacheFrom } from '../..';
import type { StageInstanceStructure } from '../../client/transformers';
import { Transformers } from '../../client/transformers';
import { fakePromise } from '../../common/it/fake-promise';
import type { APIStageInstance } from '../../types';
import type { ReturnCache } from '../index';
import { GuildRelatedResource } from './default/guild-related';

export class StageInstances extends GuildRelatedResource<any, APIStageInstance> {
	namespace = 'stage_instance';

	//@ts-expect-error
	filter(data: APIStageInstance, id: string, guild_id: string, from: CacheFrom) {
		return true;
	}

	// Discord addresses instances by channel, so the cache is keyed by
	// channel_id while the payload keeps its own instance id around.
	override parse(data: APIStageInstance, id: string, guild_id: string): APIStageInstance & { guild_id: string } {
		return { ...super.parse(data, id, guild_id), id: data.id, channel_id: id };
	}

	override get(id: string): ReturnCache<StageInstanceStructure | undefined> {
		return fakePromise(super.get(id)).then(raw =>
			raw ? Transformers.StageInstance(this.client, raw as APIStageInstance) : undefined,
		);
	}

	raw(id: string): ReturnCache<APIStageInstance | undefined> {
		return super.get(id);
	}

	override bulk(ids: string[]): ReturnCache<StageInstanceStructure[]> {
		return fakePromise(super.bulk(ids) as APIStageInstance[]).then(instances =>
			instances.map(instance => Transformers.StageInstance(this.client, instance)),
		);
	}

	bulkRaw(ids: string[]): ReturnCache<APIStageInstance[]> {
		return super.bulk(ids);
	}

	override values(guild: '*' | (string & {})): ReturnCache<StageInstanceStructure[]> {
		return fakePromise(super.values(guild) as APIStageInstance[]).then(instances =>
			instances.map(instance => Transformers.StageInstance(this.client, instance)),
		);
	}

	valuesRaw(guild: string): ReturnCache<APIStageInstance[]> {
		return super.values(guild);
	}
}
