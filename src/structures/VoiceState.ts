import type { UserStructure, UsingClient, VoiceStateStructure } from '../';
import type { GuildStructure, ReturnCache } from '../../src';
import type { VoiceStateResource } from '../cache/resources/voice-states';
import { type GuildMemberStructure, Transformers } from '../client/transformers';
import type { ObjectToLower } from '../common';
import type { APIVoiceState } from '../types';
import type { AllChannels } from './channels';
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

	async member(force?: boolean): Promise<GuildMemberStructure> {
		return (this.withMember = await this.client.members.fetch(this.guildId, this.userId, force));
	}

	user(force?: boolean): Promise<UserStructure> {
		return this.client.users.fetch(this.userId, force);
	}

	channel(mode?: 'rest' | 'flow'): Promise<AllChannels | undefined>;
	channel(mode: 'cache'): ReturnCache<AllChannels | undefined>;
	channel(mode: 'cache' | 'rest' | 'flow' = 'flow') {
		if (!this.channelId)
			return mode === 'cache' ? (this.client.cache.adapter.isAsync ? Promise.resolve() : undefined) : Promise.resolve();
		switch (mode) {
			case 'cache':
				return (
					this.client.cache.channels?.get(this.channelId) ||
					(this.client.cache.adapter.isAsync ? (Promise.resolve() as any) : undefined)
				);
			default:
				return this.client.channels.fetch(this.channelId, mode === 'rest');
		}
	}

	async setMute(mute = !this.mute, reason?: string): Promise<GuildMemberStructure> {
		const member = await this.client.members.edit(this.guildId, this.userId, { mute }, reason);
		this.mute = mute;
		return member;
	}

	async setDeaf(deaf = !this.deaf, reason?: string): Promise<GuildMemberStructure> {
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

	disconnect(reason?: string): Promise<GuildMemberStructure> {
		return this.setChannel(null, reason);
	}

	async fetch(force = false): Promise<VoiceStateStructure> {
		const member = this.withMember ?? (await this.member(force));
		return this.client.members.voice(this.guildId, member.id, force);
	}

	async setChannel(channel_id: null | string, reason?: string): Promise<GuildMemberStructure> {
		const member = await this.client.members.edit(this.guildId, this.userId, { channel_id }, reason);
		this.channelId = channel_id;
		return member;
	}

	guild(mode?: 'rest' | 'flow'): Promise<GuildStructure<'cached' | 'api'>>;
	guild(mode: 'cache'): ReturnCache<GuildStructure<'cached'> | undefined>;
	guild(mode: 'cache' | 'rest' | 'flow' = 'flow') {
		switch (mode) {
			case 'cache':
				return (
					this.client.cache.guilds?.get(this.guildId) ||
					(this.client.cache.adapter.isAsync ? (Promise.resolve() as any) : undefined)
				);
			default:
				return this.client.guilds.fetch(this.guildId, mode === 'rest');
		}
	}
}
