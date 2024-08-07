import type { APIVoiceState } from '../../types';
import type { ReturnCache } from '../..';
import { fakePromise } from '../../common';
import { GuildBasedResource } from './default/guild-based';
import { Transformers, type VoiceStateStructure } from '../../client/transformers';

export class VoiceStates extends GuildBasedResource<any, APIVoiceState> {
	namespace = 'voice_state';

	//@ts-expect-error
	filter(data: APIVoiceState, id: string, guild_id: string) {
		return true;
	}

	override parse(data: any, id: string, guild_id: string) {
		const { member, ...rest } = super.parse(data, id, guild_id);
		return rest;
	}

	override get(memberId: string, guildId: string): ReturnCache<VoiceStateStructure | undefined> {
		return fakePromise(super.get(memberId, guildId)).then(state =>
			state ? Transformers.VoiceState(this.client, state) : undefined,
		);
	}

	raw(memberId: string, guildId: string): ReturnCache<APIVoiceState | undefined> {
		return super.get(memberId, guildId);
	}

	override bulk(ids: string[], guild: string): ReturnCache<VoiceStateStructure[]> {
		return fakePromise(super.bulk(ids, guild)).then(
			states =>
				states
					.map(state => (state ? Transformers.VoiceState(this.client, state) : undefined))
					.filter(y => !!y) as VoiceStateStructure[],
		);
	}

	bulkRaw(ids: string[], guild: string): ReturnCache<APIVoiceState[]> {
		return super.bulk(ids, guild);
	}

	override values(guildId: string): ReturnCache<VoiceStateStructure[]> {
		return fakePromise(super.values(guildId)).then(states =>
			states.map(state => Transformers.VoiceState(this.client, state)),
		);
	}

	valuesRaw(guildId: string): ReturnCache<APIVoiceState[]> {
		return super.values(guildId);
	}
}

export type VoiceStateResource = Omit<APIVoiceState, 'member'> & { guild_id: string };
