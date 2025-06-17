import { Transformers, type UserStructure } from '../../client';
import type { UsingClient } from '../../commands';
import { type ObjectToLower, toCamelCase } from '../../common';
import type {
	APISoundBoard,
	GatewayGuildSoundboardSoundCreateDispatchData,
	GatewayGuildSoundboardSoundDeleteDispatchData,
	GatewayGuildSoundboardSoundsUpdateDispatchData,
	GatewayGuildSoundboardSoundUpdateDispatchData,
	GatewaySoundboardSoundsDispatchData,
} from '../../types';

export const GUILD_SOUNDBOARD_SOUND_CREATE = (
	self: UsingClient,
	data: GatewayGuildSoundboardSoundCreateDispatchData,
):
	| (ObjectToLower<Omit<GatewayGuildSoundboardSoundCreateDispatchData, 'user'>> & {
			user: UserStructure;
	  })
	| ObjectToLower<Omit<GatewayGuildSoundboardSoundCreateDispatchData, 'user'>> => {
	return data.user ? { ...toCamelCase(data), user: Transformers.User(self, data.user) } : toCamelCase(data);
};

export const GUILD_SOUNDBOARD_SOUND_UPDATE = (
	self: UsingClient,
	data: GatewayGuildSoundboardSoundUpdateDispatchData,
):
	| (ObjectToLower<Omit<GatewayGuildSoundboardSoundUpdateDispatchData, 'user'>> & {
			user: UserStructure;
	  })
	| ObjectToLower<Omit<GatewayGuildSoundboardSoundUpdateDispatchData, 'user'>> => {
	return data.user ? { ...toCamelCase(data), user: Transformers.User(self, data.user) } : toCamelCase(data);
};

export const GUILD_SOUNDBOARD_SOUNDS_UPDATE = (
	self: UsingClient,
	data: GatewayGuildSoundboardSoundsUpdateDispatchData,
): {
	guildId: string;
	sounds: (
		| (ObjectToLower<Omit<APISoundBoard, 'user'>> & {
				user: UserStructure;
		  })
		| ObjectToLower<Omit<APISoundBoard, 'user'>>
	)[];
} => {
	return {
		guildId: data.guild_id,
		sounds: data.soundboard_sounds.map(d =>
			d.user ? { ...toCamelCase(d), user: Transformers.User(self, d.user) } : toCamelCase(d),
		),
	};
};

export const GUILD_SOUNDBOARD_SOUND_DELETE = (_: UsingClient, data: GatewayGuildSoundboardSoundDeleteDispatchData) => {
	return toCamelCase(data);
};

export const SOUNDBOARD_SOUNDS = (_: UsingClient, data: GatewaySoundboardSoundsDispatchData) => {
	return toCamelCase(data);
};
