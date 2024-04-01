import type { GatewayVoiceState } from 'discord-api-types/v10';
import type { ReturnCache } from '../..';
import { fakePromise } from '../../common';
import { VoiceState } from '../../structures';
import { GuildBasedResource } from './default/guild-based';

export class VoiceStates extends GuildBasedResource<VoiceStateResource> {
	namespace = 'voice_state';

	// @ts-expect-error typescript cry about it
	override get(memberId: string, guildId: string): ReturnCache<VoiceState | undefined> {
		return fakePromise(super.get(memberId, guildId)).then(state =>
			state ? new VoiceState(this.client, state) : undefined,
		);
	}

	override parse(data: any, id: string, guild_id: string): VoiceStateResource {
		const { member, ...rest } = super.parse(data, id, guild_id);
		return rest;
	}
}

export type VoiceStateResource = Omit<GatewayVoiceState, 'member'> & { guild_id: string };
