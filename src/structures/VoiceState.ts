import type { UsingClient } from '../';
import type { VoiceStateResource } from '../cache/resources/voice-states';
import { type GuildMemberStructure, Transformers } from '../client/transformers';
import type { ObjectToLower } from '../common';
import type { APIVoiceState } from '../types';
import type { AllGuildVoiceChannels } from './channels';
import { Base } from './extra/Base';

export interface VoiceState extends Base, ObjectToLower<Omit<VoiceStateResource, 'member'>> {}

export class VoiceState extends Base {
	protected withMember?: GuildMemberStructure;
	constructor(client: UsingClient, data: APIVoiceState) {
		super(client);
		const { member, ...rest } = data;
		this.__patchThis(rest);
		if (member?.user && data.guild_id)
			this.withMember = Transformers.GuildMember(client, member, member.user, data.guild_id);
	}

	get isMuted() {
		return this.mute || this.selfMute;
	}

	async member(force?: boolean) {
		return (this.withMember = await this.client.members.fetch(this.guildId, this.userId, force));
	}

	user(force?: boolean) {
		return this.client.users.fetch(this.userId, force);
	}

	async channel(force?: boolean) {
		if (!this.channelId) return;
		return this.client.channels.fetch(this.channelId, force) as Promise<AllGuildVoiceChannels>;
	}

	async setMute(mute = !this.mute, reason?: string) {
		const member = await this.client.members.edit(this.guildId, this.userId, { mute }, reason);
		this.mute = mute;
		return member;
	}

	async setDeaf(deaf = !this.deaf, reason?: string) {
		const member = await this.client.members.edit(this.guildId, this.userId, { deaf }, reason);
		this.deaf = deaf;
		return member;
	}

	async setSuppress(suppress = !this.suppress) {
		await this.client.voiceStates.setSuppress(this.guildId, suppress);
		this.suppress = suppress;
	}

	async requestSpeak(date: string | Date = new Date()) {
		if (typeof date === 'string') date = new Date(date);
		if (Number.isNaN(date)) return Promise.reject('Invalid date');
		date = date.toISOString();
		await this.client.voiceStates.requestSpeak(this.guildId, date);
		this.requestToSpeakTimestamp = date;
	}

	disconnect(reason?: string) {
		return this.setChannel(null, reason);
	}

	async fetch(force = false) {
		const member = this.withMember ?? (await this.member(force));
		return this.client.members.voice(this.guildId, member.id, force);
	}

	async setChannel(channel_id: null | string, reason?: string) {
		const member = await this.client.members.edit(this.guildId, this.userId, { channel_id }, reason);
		this.channelId = channel_id;
		return member;
	}
}
