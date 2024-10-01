import { Transformers } from '../../client';
import type { UsingClient } from '../../commands';
import { toCamelCase } from '../../common';
import type {
	GatewayGuildSoundboardSoundCreateDispatchData,
	GatewayGuildSoundboardSoundDeleteDispatchData,
	GatewayGuildSoundboardSoundUpdateDispatchData,
	GatewayGuildSoundboardSoundsUpdateDispatchData,
	GatewaySoundboardSoundsDispatchData,
} from '../../types';

export const GUILD_SOUNDBOARD_SOUND_CREATE = (
	self: UsingClient,
	data: GatewayGuildSoundboardSoundCreateDispatchData,
) => {
	return data.user ? { ...toCamelCase(data), user: Transformers.User(self, data.user) } : toCamelCase(data);
};

export const GUILD_SOUNDBOARD_SOUND_UPDATE = (
	self: UsingClient,
	data: GatewayGuildSoundboardSoundUpdateDispatchData,
) => {
	return data.user ? { ...toCamelCase(data), user: Transformers.User(self, data.user) } : toCamelCase(data);
};

export const GUILD_SOUNDBOARD_SOUNDS_UPDATE = (
	self: UsingClient,
	data: GatewayGuildSoundboardSoundsUpdateDispatchData,
) => {
	return data.map(d => (d.user ? { ...toCamelCase(d), user: Transformers.User(self, d.user) } : toCamelCase(d)));
};

export const GUILD_SOUNDBOARD_SOUND_DELETE = (_: UsingClient, data: GatewayGuildSoundboardSoundDeleteDispatchData) => {
	return toCamelCase(data);
};

export const SOUNDBOARD_SOUNDS = (_: UsingClient, data: GatewaySoundboardSoundsDispatchData) => {
	return toCamelCase(data);
};
