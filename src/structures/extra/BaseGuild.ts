import { type APIPartialGuild, GuildFeature } from 'discord-api-types/v10';
import type { ObjectToLower } from '../../common';
import type { ImageOptions } from '../../common/types/options';
import { DiscordBase } from './DiscordBase';

export interface BaseGuild extends ObjectToLower<APIPartialGuild> {}
/**
 * Base guild class
 */
export class BaseGuild extends DiscordBase<APIPartialGuild> {
	get partnered(): boolean {
		if (!this.features) {
			return false;
		}
		return this.features.includes(GuildFeature.Partnered);
	}

	/**
	 * If the guild is verified.
	 * @link https://discord.com/developers/docs/resources/guild#guild-object-guild-features
	 */
	get verified(): boolean {
		if (!this.features) {
			return false;
		}
		return this.features.includes(GuildFeature.Verified);
	}

	/**
	 * Fetch guild on API
	 */
	async fetch() {
		const data = await this.api.guilds(this.id).get();
		return new BaseGuild(this.client, data);
	}

	/**
	 * iconURL gets the current guild icon.
	 * @link https://discord.com/developers/docs/reference#image-formatting
	 */
	iconURL(options?: ImageOptions): string | undefined {
		if (!this.icon) {
			return;
		}
		return this.rest.cdn.icons(this.id).get(this.icon, options);
	}

	/**
	 * splashURL gets the current guild splash as a string.
	 * @link https://discord.com/developers/docs/reference#image-formatting
	 * @param options - Image options for the splash url.
	 * @returns Splash url or void.
	 */
	splashURL(options?: ImageOptions): string | undefined {
		if (!this.splash) {
			return;
		}
		return this.rest.cdn['discovery-splashes'](this.id).get(this.splash, options);
	}

	/**
	 * bannerURL gets the current guild banner as a string.
	 * @link https://discord.com/developers/docs/reference#image-formatting
	 * @param options - Image options for the banner url.
	 * @returns Banner url or void
	 */
	bannerURL(options?: ImageOptions): string | undefined {
		if (!this.banner) {
			return;
		}
		return this.rest.cdn.banners(this.id).get(this.banner, options);
	}

	toString(): string {
		return this.name;
	}
}
