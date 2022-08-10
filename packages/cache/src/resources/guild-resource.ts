import { CacheAdapter } from '../adapters/cache-adapter';
import { DiscordGuild } from '@biscuitland/api-types';

import { ChannelResource } from './channel-resource';
import { GuildEmojiResource } from './guild-emoji-resource';
import { GuildMemberResource } from './guild-member-resource';
import { GuildRoleResource } from './guild-role-resource';
import { GuildStickerResource } from './guild-sticker-resource';
import { VoiceResource } from './voice-resource';

import { BaseResource } from './base-resource';

export class GuildResource extends BaseResource {
	namespace: 'guild' = 'guild';

	adapter: CacheAdapter;

	private channels: ChannelResource;
	private emojis: GuildEmojiResource;
	private members: GuildMemberResource;
	private roles: GuildRoleResource;
	private stickers: GuildStickerResource;
	private voices: VoiceResource;

	constructor(adapter: CacheAdapter) {
		super();

		this.adapter = adapter;

		this.channels = new ChannelResource(adapter);
		this.emojis = new GuildEmojiResource(adapter);
		this.members = new GuildMemberResource(adapter);
		this.roles = new GuildRoleResource(adapter);
		this.stickers = new GuildStickerResource(adapter);
		this.voices = new VoiceResource(adapter);
	}

	/**
	 * @inheritDoc
	 */

	async get(id: string): Promise<DiscordGuild | null> {
		const kv = await this.adapter.get(this.hashId(id));

		if (kv) {
			return kv;
		}

		return null;
	}

	/**
	 * @inheritDoc
	 */

	async set(id: string, data: any, expire?: number): Promise<void> {
		if (data.channels) {
			const channels: Array<Promise<any> | undefined> = [];

			for (const channel of data.channels) {
				await this.channels.set(channel.id, channel);
			}

			await Promise.all(channels);
		}

		if (data.members) {
			const members: Array<Promise<any> | undefined> = [];

			for (const member of data.members) {
				await this.members.set(member.user.id, id, member);
			}

			await Promise.all(members);
		}

		if (data.roles) {
			const roles: Array<Promise<any> | undefined> = [];

			for (const role of data.roles) {
				await this.roles.set(role.id, id, role);
			}

			await Promise.all(roles);
		}

		if (data.stickers) {
			const stickers: Array<Promise<any> | undefined> = [];

			for (const sticker of data.stickers) {
				await this.stickers.set(sticker.id, id, sticker);
			}

			await Promise.all(stickers);
		}

		if (data.emojis) {
			const emojis: Array<Promise<any> | undefined> = [];

			for (const emoji of data.emojis) {
				await this.emojis.set(emoji.id, id, emoji);
			}

			await Promise.all(emojis);
		}

		if (data.voice_states) {
			const voices: Array<Promise<any>> = [];

			for (const voice of data.voice_states) {
				if (!voice.guild_id) {
					voice.guild_id = id;
				}

				voices.push(this.voices.set(voice.user_id, id, voice));
			}

			await Promise.all(voices);
		}

		delete data.channels;
		delete data.members;
		delete data.roles;
		delete data.stickers;
		delete data.emojis;

		delete data.presences;

		delete data.voice_states;

		await this.addToRelationship(id);
		await this.adapter.set(this.hashId(id), data, expire);
	}

	/**
	 * @inheritDoc
	 */

	async count(): Promise<number> {
		return await this.adapter.count(this.namespace);
	}

	/**
	 * @inheritDoc
	 */

	async remove(id: string): Promise<void> {
		await this.adapter.remove(this.hashId(id));
	}

	/**
	 * @inheritDoc
	 */

	async contains(id: string): Promise<boolean> {
		return await this.adapter.contains(this.namespace, id);
	}

	/**
	 * @inheritDoc
	 */

	async getToRelationship(): Promise<string[]> {
		return await this.adapter.getToRelationship(this.namespace);
	}

	/**
	 * @inheritDoc
	 */

	async addToRelationship(id: string): Promise<void> {
		await this.adapter.addToRelationship(this.namespace, id);
	}
}
