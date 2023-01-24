import { Base } from './extra/base';
import type { APIUser, UserFlags } from 'discord-api-types/v10';
import type { Session } from '../session';
import type { ImageOptions } from '../utils/types';

export class User extends Base {
	constructor(session: Session, data: APIUser) {
		super(session, data.id);
		this.username = data.username;
		this.discriminator = data.discriminator;
		this.avatarHash = data.avatar ?? undefined;
		this.accentColor = data.accent_color ?? undefined;
		this.bot = !!data.bot;
		this.system = !!data.system;
		this.banner = data.banner;
		this.publicFlags = data.public_flags;
	}

	/** the user's username, not unique across the platform */
	username: string;

	/** the user's 4-digit discord-tag */
	discriminator: string;

	/** the user's avatar hash */
	avatarHash?: string;

	/** the user's banner color encoded as an integer representation of hexadecimal color code */
	accentColor?: number;

	/** whether the user belongs to an OAuth2 application */
	bot: boolean;

	/** whether the user is an Official Discord System user (part of the urgent message system) */
	system: boolean;

	/** the user's banner hash, only represent on fetch */
	banner?: string | null;

	/** the public flags on a user's account */
	publicFlags?: UserFlags;

	get tag(): string {
		return `${this.username}#${this.discriminator}`;
	}

	avatarURL(options?: ImageOptions): string {
		if (!this.avatarHash) {
			return `${this.session.cdn.embed.avatars
				.get(Number(this.discriminator) % 5)}.png`;
		}
		return this.session.utils.formatImageURL(
			this.session.cdn.user(this.id).avatar(this.avatarHash).get(),
			options?.size,
			options?.format
		);
	}

	toString(): string {
		return `<@${this.id}>`;
	}
}
