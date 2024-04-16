import type { GatewayVoiceState } from 'discord-api-types/v10';
import type { ReturnCache } from '../..';
import { fakePromise } from '../../common';
import { VoiceState } from '../../structures';
import { GuildBasedResource } from './default/guild-based';

export class VoiceStates extends GuildBasedResource {
	namespace = 'voice_state';

	override parse(data: any, id: string, guild_id: string) {
		const { member, ...rest } = super.parse(data, id, guild_id);
		return rest;
	}

	override get(memberId: string, guildId: string): ReturnCache<VoiceState | undefined> {
		return fakePromise(super.get(memberId, guildId)).then(state =>
			state ? new VoiceState(this.client, state) : undefined,
		);
	}

	override bulk(ids: string[], guild: string): ReturnCache<VoiceState[]> {
		return fakePromise(super.bulk(ids, guild)).then(
			states =>
				states.map(state => (state ? new VoiceState(this.client, state) : undefined)).filter(y => !!y) as VoiceState[],
		);
	}

	override values(guildId: string): ReturnCache<VoiceState[]> {
		return fakePromise(super.values(guildId)).then(states => states.map(state => new VoiceState(this.client, state)));
	}
}

export type VoiceStateResource = Omit<GatewayVoiceState, 'member'> & { guild_id: string };
