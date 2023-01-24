export interface CDNRoutes {
	embed: {
		avatars: {
			get(embed: UserAvatarDefault): string;
		};
	};
	user(id: string): {
		avatar(icon: string): {
			get(): string;
		};
	};
	icons: {
		guild(id: string): {
			icon(hash: string): {
				get: string;
			};
		};
	};
	discoverySplashes(guidId: string): {
		get(hash: string): string;
	};
	banners: {
		guild(id: string): {
			get(hash: string): string;
		};
	};
	guilds(id: string): {
		users(id: string): {
			avatars(hash: string): {
				get: string;
			};
			banners(hash: string): {
				get: string;
			};
		};
	};
}

export type UserAvatarDefault = 1 | 2 | 3 | 4 | 5 | number;
