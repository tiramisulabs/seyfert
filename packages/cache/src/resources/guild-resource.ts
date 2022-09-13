/**
 * refactor
 */

import type { CacheAdapter } from '../scheme/adapters/cache-adapter';
import type { DiscordGuild } from '@biscuitland/api-types';

import { ChannelResource } from './channel-resource';
import { GuildEmojiResource } from './guild-emoji-resource';
import { GuildMemberResource } from './guild-member-resource';
import { GuildRoleResource } from './guild-role-resource';
import { GuildStickerResource } from './guild-sticker-resource';
import { GuildVoiceResource } from './guild-voice-resource';

import { PresenceResource } from './presence-resource';
import { BaseResource } from './base-resource';

/**
 * Resource represented by an guild of discord
 */

export class GuildResource extends BaseResource<DiscordGuild> {
	#namespace = 'guild' as const;

	#adapter: CacheAdapter;

	#channels: ChannelResource;
	#emojis: GuildEmojiResource;
	#members: GuildMemberResource;
	#roles: GuildRoleResource;
	#stickers: GuildStickerResource;
	#voices: GuildVoiceResource;

	#presences: PresenceResource;

	constructor(
		adapter: CacheAdapter,
		entity?: DiscordGuild | null,
		parent?: string,
		channels?: ChannelResource,
		emojis?: GuildEmojiResource,
		members?: GuildMemberResource,
		roles?: GuildRoleResource,
		stickers?: GuildStickerResource,
		voices?: GuildVoiceResource,
		presences?: PresenceResource
	) {
		super('guild', adapter);

		this.#adapter = adapter;

		this.#channels = channels ?? new ChannelResource(adapter);

		this.#emojis = emojis ?? new GuildEmojiResource(adapter);
		this.#members = members ?? new GuildMemberResource(adapter);

		this.#roles = roles ?? new GuildRoleResource(adapter);

		this.#stickers = stickers ?? new GuildStickerResource(adapter);

		this.#voices = voices ?? new GuildVoiceResource(adapter);
		this.#presences = presences ?? new PresenceResource(adapter);

		if (entity) {
			this.setEntity(entity);
		}

		if (parent) {
			this.setParent(parent);
		}
	}

	/**
	 * @inheritDoc
	 */

	async get(id: string): Promise<GuildResource | null> {
		if (this.parent) {
			return this;
		}

		const kv = await this.#adapter.get(this.hashId(id));

		if (kv) {
			return new GuildResource(
				this.#adapter,
				kv,
				id,
				new ChannelResource(this.#adapter),
				new GuildEmojiResource(this.#adapter, null, id),
				new GuildMemberResource(this.#adapter, null, id),
				new GuildRoleResource(this.#adapter, null, id),
				new GuildStickerResource(this.#adapter, null, id),
				new GuildVoiceResource(this.#adapter, null, id),
				new PresenceResource(this.#adapter)
			);
		}

		return null;
	}

	/**
	 * @inheritDoc
	 */

	async set(id: string, data: any): Promise<void> {
		if (data.channels) {
			const channels: unknown[] = [];

			for (const channel of data.channels) {
				channel.guild_id = id;

				await this.#channels.set(channel.id, channel);
			}

			await Promise.all(channels);
		}

		if (data.emojis) {
			const emojis: unknown[] = [];

			for (const emoji of data.emojis) {
				emoji.guild_id = id;

				await this.#emojis.set(emoji.id, id, emoji);
			}

			await Promise.all(emojis);
		}

		if (data.members) {
			const members: unknown[] = [];

			for (const member of data.members) {
				member.guild_id = id;

				await this.#members.set(member.user.id, id, member);
			}

			await Promise.all(members);
		}

		if (data.roles) {
			const roles: unknown[] = [];

			for (const role of data.roles) {
				role.guild_id = id;

				await this.#roles.set(role.id, id, role);
			}

			await Promise.all(roles);
		}

		if (data.stickers) {
			const stickers: unknown[] = [];

			for (const sticker of data.stickers) {
				sticker.guild_id = id;

				await this.#stickers.set(sticker.id, id, sticker);
			}

			await Promise.all(stickers);
		}

		if (data.voice_states) {
			const voices: unknown[] = [];

			for (const voice of data.voice_states) {
				voice.guild_id = id;

				voices.push(this.#voices.set(voice.user_id, id, voice));
			}

			await Promise.all(voices);
		}

		if (data.presences) {
			const presences: unknown[] = [];

			for (const presence of data.presences) {
				await this.#presences.set(presence.user.id, presence);
			}

			await Promise.all(presences);
		}

		delete data.channels;
		delete data.emojis;
		delete data.members;
		delete data.roles;
		delete data.stickers;

		delete data.voice_states;
		delete data.guild_hashes;

		delete data.presences;

		if (this.parent) {
			this.setEntity(data);
		}

		await this.addToRelationship(id);
		await this.#adapter.set(this.hashId(id), data);
	}

	/**
	 * @inheritDoc
	 */

	async items(): Promise<GuildResource[]> {
		const data = await this.#adapter.items(this.#namespace);

		if (data) {
			return data.map(dt => {
				const resource = new GuildResource(this.#adapter, dt);
				resource.setParent(resource.id);

				return resource;
			});
		}

		return [];
	}

	/**
	 * @inheritDoc
	 */

	async count(): Promise<number> {
		return await this.#adapter.count(this.#namespace);
	}

	/**
	 * @inheritDoc
	 */

	async remove(id: string): Promise<void> {
		const members = await this.#members.getToRelationship(id);

		for (const member of members) {
			await this.#members.remove(member, id);
		}

		const roles = await this.#roles.getToRelationship(id);

		for (const role of roles) {
			await this.#roles.remove(role, id);
		}

		const emojis = await this.#emojis.getToRelationship(id);

		for (const emoji of emojis) {
			await this.#emojis.remove(emoji, id);
		}

		const stickers = await this.#stickers.getToRelationship(id);

		for (const sticker of stickers) {
			await this.#stickers.remove(sticker, id);
		}

		await this.removeToRelationship(id);
		await this.#adapter.remove(this.hashId(id));
	}

	/**
	 * @inheritDoc
	 */

	async contains(id: string): Promise<boolean> {
		return await this.#adapter.contains(this.#namespace, id);
	}

	/**
	 * @inheritDoc
	 */

	async getToRelationship(): Promise<string[]> {
		return await this.#adapter.getToRelationship(this.#namespace);
	}

	/**
	 * @inheritDoc
	 */

	async addToRelationship(id: string): Promise<void> {
		await this.#adapter.addToRelationship(this.#namespace, id);
	}

	/**
	 * @inheritDoc
	 */

	async removeToRelationship(id: string): Promise<void> {
		await this.#adapter.removeToRelationship(this.#namespace, id);
	}

	/**
	 * @inheritDoc
	 */

	async getEmojis(): Promise<GuildEmojiResource[]> {
		return await this.#emojis.items(this.parent as string);
	}

	/**
	 * @inheritDoc
	 */

	async getMembers(): Promise<GuildMemberResource[]> {
		return await this.#members.items(this.parent as string);
	}

	/**
	 * @inheritDoc
	 */

	async getRoles(): Promise<GuildRoleResource[]> {
		return await this.#roles.items(this.parent as string);
	}

	/**
	 * @inheritDoc
	 */

	async getStickers(): Promise<GuildStickerResource[]> {
		return await this.#stickers.items(this.parent as string);
	}

	/**
	 * @inheritDoc
	 */

	async getVoiceStates(): Promise<GuildVoiceResource[]> {
		return await this.#voices.items(this.parent as string);
	}
}
