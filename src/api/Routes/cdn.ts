import type { BaseCDNUrlOptions, CDNUrlOptions } from '../..';
import type { StickerExtension } from '../shared';

export interface CDNRoute {
	embed: {
		avatars: {
			get(embed: UserAvatarDefault): string;
		};
	};
	avatars(id: string): {
		get(hash: string, options?: CDNUrlOptions): string;
	};
	'avatar-decorations'(userId: string): {
		get(hash: string, options?: BaseCDNUrlOptions): string;
	};
	'channel-icons'(channelId: string): {
		get(hash: string, options?: BaseCDNUrlOptions): string;
	};
	icons(guildId: string): {
		get(hash: string, options?: CDNUrlOptions): string;
	};
	splashes(guildId: string): {
		get(hash: string, options?: BaseCDNUrlOptions): string;
	};
	'discovery-splashes'(guidId: string): {
		get(hash: string, options?: BaseCDNUrlOptions): string;
	};
	banners(id: string): {
		get(hash: string, options?: CDNUrlOptions): string;
	};
	guilds(id: string): {
		users(id: string): {
			avatars(hash: string): {
				get(options?: CDNUrlOptions): string;
			};
			banners(hash: string): {
				get(options?: CDNUrlOptions): string;
			};
		};
	};
	'guild-events'(eventId: string): {
		get(hash: string, options?: BaseCDNUrlOptions): string;
	};
	emojis(id: string): {
		get(options?: BaseCDNUrlOptions): string;
	};
	appIcons(appId: string): {
		get(iconOrCover: string, options?: BaseCDNUrlOptions): string;
	};
	'app-assets'(appId: string): {
		get(asset: string): string;
		achievements(id: string): {
			icons(hash: string): {
				get(options?: BaseCDNUrlOptions): string;
			};
		};
	};
	'team-icons'(teamId: string): {
		get(hash: string, options?: BaseCDNUrlOptions): string;
	};
	stickers(id: string): {
		get(extension: StickerExtension): string;
	};
	'role-icons'(roleId: string): {
		get(icon: string, options?: BaseCDNUrlOptions): string;
	};
	'guild-events'(id: string): {
		get(cover: string, options?: BaseCDNUrlOptions): string;
	};
}

export interface CDNRoute {
	'app-assets'(id: '710982414301790216'): {
		store(packBannerId: string): {
			get(options?: BaseCDNUrlOptions): string;
		};
	};
}

export type UserAvatarDefault = 1 | 2 | 3 | 4 | 5 | number;
