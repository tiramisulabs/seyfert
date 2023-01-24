import type {
	APIGuild,
	GuildNSFWLevel,
	GuildVerificationLevel,
} from 'discord-api-types/v10';
import type { Session } from '../session';
import type { ImageOptions } from '../utils/types';
import { BaseGuild } from './extra/BaseGuild';

/**
 * Class for anonymous guilds.
 * @link https://discord.com/developers/docs/resources/guild#guild-resource
 */
export class AnonymousGuild extends BaseGuild {
	constructor(session: Session, data: APIGuild) {
		super(session, data);
		this.verificationLevel = data.verification_level;
		this.nsfwLevel = data.nsfw_level;

		this.splashHash = data.splash ?? undefined;
		this.bannerHash = data.banner ?? undefined;
		this.vanityUrlCode = data.vanity_url_code ?? undefined;
		this.description = data.description ?? undefined;
		this.premiumSubscriptionCount = data.premium_subscription_count;
	}

	/**
	 * The guild's splash hash.
	 * @link https://discord.com/developers/docs/reference#image-formatting
	 */
	splashHash?: string;

	/**
	 * The guild's banner hash.
	 * @link https://discord.com/developers/docs/reference#image-formatting
	 */
	bannerHash?: string;

	/**
	 * The guild's verification level.
	 * @link https://discord.com/developers/docs/resources/guild#guild-object-verification-level
	 */
	verificationLevel: GuildVerificationLevel;

	/** The guild's vanity url code. */
	vanityUrlCode?: string;

	/**
	 * The guild's nsfw level.
	 * @link https://discord.com/developers/docs/resources/guild#guild-object-guild-nsfw-level
	 */
	nsfwLevel: GuildNSFWLevel;

	/** The guild's description. */
	description?: string;

	/** The number of boosts this guild currently has. */
	premiumSubscriptionCount?: number;

	/**
	 * splashURL gets the current guild splash as a string.
	 * @link https://discord.com/developers/docs/reference#image-formatting
	 * @param options - Image options for the splash url.
	 * @returns Splash url or void.
	 */
	splashURL(options?: ImageOptions): string | void {
		if (!this.splashHash) { return; }
		this.session.utils.formatImageURL(
			this.session.cdn.splashes
				.guild(this.id)
				.splash(this.splashHash)
				.get(),
			options?.size,
			options?.format
		);
	}

	/**
	 * bannerURL gets the current guild banner as a string.
	 * @link https://discord.com/developers/docs/reference#image-formatting
	 * @param options - Image options for the banner url.
	 * @returns Banner url or void
	 */
	bannerURL(options?: ImageOptions): string | void {
		if (!this.bannerHash) { return; }
		this.session.utils.formatImageURL(
			this.session.cdn.banners
				.guild(this.id)
				.banner(this.bannerHash)
				.get(),
			options?.size,
			options?.format
		);
	}
}
