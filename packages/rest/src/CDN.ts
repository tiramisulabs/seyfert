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
	discoverySplashes(guidId: string): {
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
}

export type UserAvatarDefault = 1 | 2 | 3 | 4 | 5 | number;
