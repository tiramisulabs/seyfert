import type {
	RESTPatchAPIGuildSoundboardSoundJSONBody,
	RESTPostAPIGuildSoundboardSoundJSONBody,
	RESTPostAPISoundboardSendSoundJSONBody,
} from '../../types';
import { BaseShorter } from './base';

export class SoundboardShorter extends BaseShorter {
	getDefaults() {
		return this.client.proxy['soundboard-default-sounds'].get();
	}

	send(channelId: string, body: RESTPostAPISoundboardSendSoundJSONBody) {
		return this.client.proxy.channels(channelId)['send-soundboard-sound'].post({
			body,
		});
	}

	list(guildId: string) {
		return this.client.proxy.guilds(guildId)['soundboard-sounds'].get();
	}

	get(guildId: string, soundID: string) {
		return this.client.proxy.guilds(guildId)['soundboard-sounds'](soundID).get();
	}

	create(guildId: string, body: RESTPostAPIGuildSoundboardSoundJSONBody) {
		return this.client.proxy.guilds(guildId)['soundboard-sounds'].post({
			body,
		});
	}

	edit(guildId: string, soundID: string, body: RESTPatchAPIGuildSoundboardSoundJSONBody) {
		return this.client.proxy.guilds(guildId)['soundboard-sounds'](soundID).patch({
			body,
		});
	}

	delete(guildId: string, soundID: string, reason?: string) {
		return this.client.proxy.guilds(guildId)['soundboard-sounds'](soundID).delete({ reason });
	}
}
