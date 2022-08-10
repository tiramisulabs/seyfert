import { MemoryCacheAdapter } from './adapters/memory-cache-adapter';
// import { RedisCacheAdapter } from './adapters/redis-cache-adapter';

import {
	ChannelResource,
	GuildEmojiResource,
	GuildMemberResource,
	GuildResource,
	GuildRoleResource,
	GuildStickerResource,
	UserResource,
	VoiceResource
} from './resources';

/**
 * add options and adaptor passable by options
 * @default MemoryCacheAdapter
 */

/**
 * Add more adapters and options
 * Allow passing customizable resources and deleting resources
 */

/**
 * Add presence system (disabled by default)
 * Add TTL option (default 7 days)
 * Add permissions resource (accessible as a subResource)
 */
export class Cache {
	readonly channels: ChannelResource;

	readonly emojis: GuildEmojiResource;
	readonly members: GuildMemberResource;
	readonly guilds: GuildResource;
	readonly roles: GuildRoleResource;
	readonly stickers: GuildStickerResource;

	readonly users: UserResource;
	readonly voices: VoiceResource;

	ready: boolean;

	constructor() {
		this.ready = false;

		/** this change to memory */
		const adapter = new MemoryCacheAdapter();

		this.channels = new ChannelResource(adapter);

		this.emojis = new GuildEmojiResource(adapter);
		this.members = new GuildMemberResource(adapter);

		this.guilds = new GuildResource(adapter);
		this.roles = new GuildRoleResource(adapter);
		this.stickers = new GuildStickerResource(adapter);

		this.users = new UserResource(adapter);
		this.voices = new VoiceResource(adapter);
	}

	/**
	 * @inheritDoc
	 */

	async start(event: { t: string; d: any }) {
		switch (event.t) {
			case 'READY':
				await this.users.set(event.d.user.id, event.d.user);

				const guilds: Array<Promise<any> | undefined> = [];

				for (const guild of event.d.guilds) {
					guilds.push(this.guilds.set(guild.id, guild));
				}

				await Promise.all(guilds);

				this.ready = true;
				break;

			case 'USER_UPDATE':
				await this.users.set(event.d.id, event.d);
				break;

			case 'GUILD_CREATE':
				await this.guilds.set(event.d.id, event.d);
				break;

			case 'GUILD_UPDATE':
				this.guilds.set(event.d.id, event.d);
				break;

			case 'GUILD_DELETE':
				if (event.d.unavailable) {
					await this.guilds.set(event.d.id, event.d);
				} else {
					await this.guilds.remove(event.d.id);
				}
				break;

			case 'CHANNEL_CREATE':
				// modify [Add elimination system]
				await this.channels.set(event.d.id, event.d);
				break;

			case 'CHANNEL_UPDATE':
				// modify [Add elimination system]
				await this.channels.set(event.d.id, event.d);
				break;

			case 'CHANNEL_DELETE':
				// modify [Add elimination system]
				await this.channels.remove(event.d.id);
				break;

			case 'GUILD_ROLE_CREATE':
				await this.roles.set(
					event.d.role.id,
					event.d.guild_id,
					event.d.role
				);
				break;

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
				// modify [Add elimination system]
				for (const v of event.d.emojis) {
					await this.emojis?.set(v.id, event.d.guild_id, v);
				}
				break;

			case 'GUILD_STICKERS_UPDATE':
				// modify [Add elimination system]
				for (const v of event.d.stickers) {
					await this.stickers?.set(v.id, event.d.guild_id, v);
				}
				break;

			case 'GUILD_MEMBER_ADD':
				await this.members.set(
					event.d.user.id,
					event.d.guild_id,
					event.d
				);
				break;

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
				const members: Array<Promise<any> | undefined> = [];

				for (const member of event.d.members) {
					members.push(
						this.members.set(
							member.user.id,
							event.d.guild_id,
							member
						)
					);
				}

				await Promise.all(members);

				break;

			case 'VOICE_STATE_UPDATE':
				if (!event.d.guild_id) {
					return;
				}

				if (event.d.user_id && event.d.member) {
					await this.members.set(
						event.d.user_id,
						event.d.guild_id,
						event.d.member
					);
				}

				if (event.d.channel_id != null) {
					await this.voices.set(
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
