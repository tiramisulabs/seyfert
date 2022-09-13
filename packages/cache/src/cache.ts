/* eslint-disable no-case-declarations */
import type { CacheOptions, CO } from './types';

import type { CacheAdapter } from './scheme/adapters/cache-adapter';
import { MemoryCacheAdapter } from './scheme/adapters/memory-cache-adapter';

import {
	ChannelResource,
	GuildEmojiResource,
	GuildMemberResource,
	GuildResource,
	GuildRoleResource,
	GuildStickerResource,
	GuildVoiceResource,
	PresenceResource,
	UserResource,
} from './resources';

import { Options } from './utils/options';

export class Cache {
	static readonly DEFAULTS = {
		adapter: new MemoryCacheAdapter(),
	};

	readonly options: CO;
	#adapter: CacheAdapter;

	// move to resources assigned

	readonly channels: ChannelResource;

	readonly emojis: GuildEmojiResource;
	readonly members: GuildMemberResource;
	readonly guilds: GuildResource;
	readonly roles: GuildRoleResource;
	readonly stickers: GuildStickerResource;
	readonly voices: GuildVoiceResource;

	readonly presences: PresenceResource;
	readonly users: UserResource;

	constructor(options: CacheOptions) {
		this.options = Options({}, Cache.DEFAULTS, options);
		this.#adapter = this.options.adapter;

		this.channels = new ChannelResource(this.#adapter);

		this.emojis = new GuildEmojiResource(this.#adapter);
		this.members = new GuildMemberResource(this.#adapter);

		this.guilds = new GuildResource(this.#adapter);
		this.roles = new GuildRoleResource(this.#adapter);

		this.stickers = new GuildStickerResource(this.#adapter);
		this.voices = new GuildVoiceResource(this.#adapter);

		this.presences = new PresenceResource(this.#adapter);
		this.users = new UserResource(this.#adapter);
	}

	/**
	 * @inheritDoc
	 */

	async start(event: any) {
		let resources: any[] = [];

		let contents: any[] = [];

		switch (event.t) {
			case 'READY':
				resources = [];

				await this.users.set(event.d.user.id, event.d.user);

				for (const guild of event.d.guilds) {
					resources.push(this.guilds.set(guild.id, guild));
				}

				await Promise.all(resources);

				break;

			case 'USER_UPDATE':
				await this.users.set(event.d.id, event.d);
				break;
			case 'PRESENCE_UPDATE':
				await this.presences.set(event.d.user?.id, event.d);

				break;

			case 'GUILD_CREATE':
			case 'GUILD_UPDATE':
				await this.guilds.set(event.d.id, event.d);
				break;

			case 'GUILD_DELETE':
				if (event.d.unavailable) {
					await this.guilds.set(event.d.id, event.d);
				} else {
					await this.guilds.remove(event.d.id);
				}
				break;

			case 'CHANNEL_CREATE':
			case 'CHANNEL_UPDATE':
				// modify [Add elimination system]
				await this.channels.set(event.d.id, event.d);
				break;

			case 'CHANNEL_DELETE':
				// modify [Add elimination system]
				await this.channels.remove(event.d.id);
				break;

			case 'MESSAGE_CREATE':
				if (event.d.webhook_id) {
					return;
				}

				if (event.d.author) {
					await this.users.set(event.d.author.id, event.d.author);
				}

				break;

			case 'GUILD_ROLE_CREATE':
			case 'GUILD_ROLE_UPDATE':
				await this.roles.set(
					event.d.role.id,
					event.d.guild_id,
					event.d.role
				);
				break;

			case 'GUILD_ROLE_DELETE':
				await this.roles.remove(event.d.role.id, event.d.guild_id);
				break;

			case 'GUILD_EMOJIS_UPDATE':
				contents = [];
				contents = await this.emojis.items(event.d.guild_id);

				for (const emoji of event.d.emojis) {
					const emote = contents.find(o => o?.id === emoji.id);

					if (!emote || emote !== emoji) {
						await this.emojis.set(
							emoji.id,
							event.d.guild_id,
							emoji
						);
					}
				}

				for (const emoji of contents) {
					const emote = event.d.emojis.find(
						(o: any) => o.id === emoji?.id
					);

					if (!emote) {
						await this.emojis.remove(emote.id, event.d.guild_id);
					}
				}

				break;

			case 'GUILD_STICKERS_UPDATE':
				contents = [];
				contents = await this.stickers.items(event.d.guild_id);

				for (const sticker of event.d.stickers) {
					const stick = contents.find(o => o?.id === sticker.id);

					if (!stick || stick !== sticker) {
						await this.stickers.set(
							sticker.id,
							event.d.guild_id,
							sticker
						);
					}
				}

				for (const sticker of contents) {
					const stick = event.d.stickers.find(
						(o: any) => o.id === sticker?.id
					);

					if (!stick) {
						await this.stickers.remove(stick.id, event.d.guild_id);
					}
				}

				break;

			case 'GUILD_MEMBER_ADD':
			case 'GUILD_MEMBER_UPDATE':
				await this.members.set(
					event.d.user.id,
					event.d.guild_id,
					event.d
				);
				break;

			case 'GUILD_MEMBER_REMOVE':
				await this.members.remove(event.d.user.id, event.d.guild_id);
				break;

			case 'GUILD_MEMBERS_CHUNK':
				resources = [];

				for (const member of event.d.members) {
					resources.push(
						this.members.set(
							member.user.id,
							event.d.guild_id,
							member
						)
					);
				}

				await Promise.all(resources);

				break;

			case 'VOICE_STATE_UPDATE':
				if (!event.d.guild_id) {
					return;
				}

				if (event.d.guild_id && event.d.member && event.d.user_id) {
					await this.members.set(event.d.user_id, event.d.guild_id, {
						guild_id: event.d.guild_id,
						...event.d.member,
					});
				}

				if (event.d.channel_id != null) {
					await this.members.set(
						event.d.user_id,
						event.d.guild_id,
						event.d
					);
				} else {
					await this.voices.remove(event.d.user_id, event.d.guild_id);
				}

				break;
		}
	}
}
