import type { GuildMember, UsingClient } from '../';
import type { VoiceStateResource } from '../cache/resources/voice-states';
import type { ObjectToLower } from '../common';
import { Base } from './extra/Base';

export interface VoiceState extends Base, ObjectToLower<VoiceStateResource> {}

export class VoiceState extends Base {
	constructor(
		client: UsingClient,
		data: VoiceStateResource,
		private withMember?: GuildMember,
	) {
		super(client);
		this.__patchThis(data);
	}

	isMuted() {
		return this.mute || this.selfMute;
	}

	async member(force?: boolean) {
		return (this.withMember ??= await this.client.members.fetch(this.guildId, this.userId, force));
	}

	async user(force?: boolean) {
		return this.client.users.fetch(this.userId, force);
	}

	async channel(force?: boolean) {
		if (!this.channelId) return;
		return this.client.channels.fetch(this.channelId, force);
	}

	async setMute(mute = !this.mute, reason?: string) {
		return this.client.members.edit(this.guildId, this.userId, { mute }, reason).then(member => {
			this.mute = mute;
			return member;
		});
	}

	async setDeaf(deaf = !this.deaf, reason?: string) {
		return this.client.members.edit(this.guildId, this.userId, { deaf }, reason).then(member => {
			this.deaf = deaf;
			return member;
		});
	}

	async disconnect(reason?: string) {
		return this.setChannel(null, reason);
	}

	async setChannel(channel_id: null | string, reason?: string) {
		return this.client.members.edit(this.guildId, this.userId, { channel_id }, reason).then(member => {
			this.channelId = channel_id;
			return member;
		});
	}
}
