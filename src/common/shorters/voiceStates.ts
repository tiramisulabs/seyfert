import { BaseShorter } from './base';

export class VoiceStateShorter extends BaseShorter {
	requestSpeak(guildId: string, date: string) {
		return this.client.proxy.guilds(guildId)['voice-states']['@me'].patch({
			body: { request_to_speak_timestamp: date },
		});
	}

	setSuppress(guildId: string, suppress: boolean) {
		return this.client.proxy.guilds(guildId)['voice-states']['@me'].patch({
			body: { suppress },
		});
	}
}
