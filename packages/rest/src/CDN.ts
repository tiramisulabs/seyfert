export interface CDNRoutes {
	embed: {
		avatars: {
			get(embed: UserAvatarDefault): string;
		};
	};
	avatars(id: string): {
		get(hash: string): string;
	};
	icons(guildId: string): {
		get(hash: string): string;
	};
	splashes(guildId: string): {
		get(hash: string): string;
	};
	'discovery-splashes'(guidId: string): {
		get(hash: string): string;
	};
	banners(id: string): {
		get(hash: string): string;
	};
	guilds(id: string): {
		users(id: string): {
			avatars(hash: string): {
				get(): string;
			};
			banners(hash: string): {
				get(): string;
			};
		};
	};
	emojis(id: string): {
		get(): string;
	};
	appIcons(appId: string): {
		get(iconOrCover: string): string;
	};
	'app-assets'(appId: string): {
		get(asset: string): string;
		achievements(id: string): {
			icons(hash: string): {
				get(): string;
			};
		};
	};
	'team-icons'(teamId: string): {
		get(hash: string): string;
	};
	stickers(id: string): {
		get(): string;
	};
	'role-icons'(roleId: string): {
		get(icon: string): string;
	};
	'guild-events'(id: string): {
		get(cover: string): string;
	};
}

export interface CDNRoutes {
	'app-assets'(id: '710982414301790216'): {
		store(packBannerId: string): {
			get(): string;
		};
	};
}

export type UserAvatarDefault = 1 | 2 | 3 | 4 | 5 | number;
