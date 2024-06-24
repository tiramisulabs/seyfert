import type { UsingClient } from '../';
import type { VoiceStateResource } from '../cache/resources/voice-states';
import { type GuildMemberStructure, Transformers } from '../client/transformers';
import type { ObjectToLower } from '../common';
import type { GatewayVoiceState } from '../types';
import { Base } from './extra/Base';

export interface VoiceState extends Base, ObjectToLower<Omit<VoiceStateResource, 'member'>> {}

export class VoiceState extends Base {
	protected withMember?: GuildMemberStructure;
	constructor(client: UsingClient, data: GatewayVoiceState) {
		super(client);
		const { member, ...rest } = data;
		this.__patchThis(rest);
		if (member?.user && data.guild_id)
			this.withMember = Transformers.GuildMember(client, member, member.user, data.guild_id);
	}

	isMuted() {
		return this.mute || this.selfMute;
	}

	async member(force?: boolean) {
		return (this.withMember = await this.client.members.fetch(this.guildId, this.userId, force));
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

	async setSuppress(suppress = !this.suppress) {
		await this.client.proxy.guilds(this.guildId)['voice-states']['@me'].patch({
			body: { suppress },
		});
		this.suppress = suppress;
	}

	async requestSpeak(date: string | Date = new Date()) {
		if (typeof date === 'string') date = new Date(date);
		if (Number.isNaN(date)) return Promise.reject('Invalid date');
		date = date.toISOString();

		await this.client.proxy.guilds(this.guildId)['voice-states']['@me'].patch({
			body: { request_to_speak_timestamp: date },
		});
		this.requestToSpeakTimestamp = date;
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
