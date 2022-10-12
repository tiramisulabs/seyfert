import type { Model } from './base';
import type { Snowflake } from '../snowflakes';
import type { Session } from '../biscuit';
import type { DiscordUser, PremiumTypes, UserFlags } from '@biscuitland/api-types';
import type { ImageFormat, ImageSize } from '../utils/util';
import { USER, USER_AVATAR, USER_DEFAULT_AVATAR } from '@biscuitland/api-types';
import { Util } from '../utils/util';
import { DMChannel } from './channels';

export type AvatarOptions = {
	format?: ImageFormat;
	size?: ImageSize;
};

/**
 * Represents a user
 * @link https://discord.com/developers/docs/resources/user#user-object
 */
export class User implements Model {
	constructor(session: Session, data: DiscordUser) {
		this.session = session;
		this.id = data.id;

		this.username = data.username;
		this.discriminator = data.discriminator;
		this.avatarHash = data.avatar
			? data.avatar
			: undefined;

		this.accentColor = data.accent_color;
		this.bot = !!data.bot;
		this.system = !!data.system;
		this.banner = data.banner
			? data.banner
			: undefined;

		this.mfaEnabled = !!data.mfa_enabled;
		this.locale = data.locale;
		this.email = data.email ? data.email : undefined;
		this.verified = !!data.verified;
		this.flags = data.flags;
	}

	/** the session that instantiated this User */
	readonly session: Session;

	/** the user's id */
	readonly id: Snowflake;

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

	/** the user's banner hash */
	banner?: string;

	/** whether the user has two factor enabled on their account */
	mfaEnabled: boolean;

	/** the user's chosen language option */
	locale?: string;

	/** the user's email */
	email?: string;

	/** the flags on a user's account */
	flags?: UserFlags;

	/** whether the email on this account has been verified */
	verified: boolean;

	/** the type of Nitro subscription on a user's account */
	premiumType?: PremiumTypes;

	/** the public flags on a user's account */
	publicFlags?: UserFlags;

	/** gets the user's username#discriminator */
	get tag(): string {
		return `${this.username}#${this.discriminator}`;
	}

	/** fetches this user */
	async fetch(): Promise<User> {
		const user = await this.session.rest.get<DiscordUser>(USER(this.id));

		return new User(this.session, user);
	}

	/** gets the user's avatar */
	avatarURL(options: AvatarOptions): string {
		if (!this.avatarHash) {
			return USER_DEFAULT_AVATAR(Number(this.discriminator) % 5);
		}

		return Util.formatImageURL(USER_AVATAR(
			this.id,
			this.avatarHash
		), options.size ?? 128, options.format);
	}

	openDM(): Promise<DMChannel> {
		return DMChannel.prototype.open.call({ session: this.session }, this.id);
	}

	toString(): string {
		return `<@${this.id}>`;
	}
}
