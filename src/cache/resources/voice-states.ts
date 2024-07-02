import type { GatewayVoiceState } from 'discord-api-types/v10';
import type { ReturnCache } from '../..';
import { fakePromise } from '../../common';
import { GuildBasedResource } from './default/guild-based';
import { Transformers, type VoiceStateStructure } from '../../client/transformers';

export class VoiceStates extends GuildBasedResource<any, GatewayVoiceState> {
	namespace = 'voice_state';

	//@ts-expect-error
	filter(data: GatewayVoiceState, id: string, guild_id: string) {
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

	raw(memberId: string, guildId: string): ReturnCache<GatewayVoiceState | undefined> {
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

	bulkRaw(ids: string[], guild: string): ReturnCache<GatewayVoiceState[]> {
		return super.bulk(ids, guild);
	}

	override values(guildId: string): ReturnCache<VoiceStateStructure[]> {
		return fakePromise(super.values(guildId)).then(states =>
			states.map(state => Transformers.VoiceState(this.client, state)),
		);
	}

	valuesRaw(guildId: string): ReturnCache<GatewayVoiceState[]> {
		return super.values(guildId);
	}
}

export type VoiceStateResource = Omit<GatewayVoiceState, 'member'> & { guild_id: string };
