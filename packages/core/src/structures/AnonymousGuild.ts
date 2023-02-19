import type { APIPartialGuild, GuildVerificationLevel } from "discord-api-types/v10";
import type { Session } from "../session";
import type { ImageOptions } from "../";
import { BaseGuild } from "./extra/BaseGuild";

/**
 * Class for anonymous guilds.
 * @link https://discord.com/developers/docs/resources/guild#guild-resource
 */
export class AnonymousGuild extends BaseGuild {
	constructor(session: Session, data: APIPartialGuild) {
		super(session, data);
		this.verificationLevel = data.verification_level;
		this.splash = data.splash ?? undefined;
		this.banner = data.banner ?? undefined;
		this.vanityUrlCode = data.vanity_url_code ?? undefined;
		this.description = data.description ?? undefined;
	}

	/**
	 * The guild's splash hash.
	 * @link https://discord.com/developers/docs/reference#image-formatting
	 */
	splash?: string;

	/**
	 * The guild's banner hash.
	 * @link https://discord.com/developers/docs/reference#image-formatting
	 */
	banner?: string;

	/**
	 * The guild's verification level.
	 * @link https://discord.com/developers/docs/resources/guild#guild-object-verification-level
	 */
	verificationLevel?: GuildVerificationLevel;

	/** The guild's vanity url code. */
	vanityUrlCode?: string;

	/** The guild's description. */
	description?: string;

	/**
	 * splashURL gets the current guild splash as a string.
	 * @link https://discord.com/developers/docs/reference#image-formatting
	 * @param options - Image options for the splash url.
	 * @returns Splash url or void.
	 */
	splashURL(options?: ImageOptions): string | void {
		if (!this.splash) {
			return;
		}
		this.session.utils.formatImageURL(
			this.session.cdn.discoverySplashes(this.id).get(this.splash),
			options?.size,
			options?.format,
		);
	}

	/**
	 * bannerURL gets the current guild banner as a string.
	 * @link https://discord.com/developers/docs/reference#image-formatting
	 * @param options - Image options for the banner url.
	 * @returns Banner url or void
	 */
	bannerURL(options?: ImageOptions): string | void {
		if (!this.banner) {
			return;
		}
		this.session.utils.formatImageURL(
			this.session.cdn.banners(this.id).get(this.banner),
			options?.size,
			options?.format,
		);
	}
}
