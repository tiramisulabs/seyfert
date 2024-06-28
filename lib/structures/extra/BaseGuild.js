"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseGuild = void 0;
const v10_1 = require("discord-api-types/v10");
const DiscordBase_1 = require("./DiscordBase");
/**
 * Base guild class
 */
class BaseGuild extends DiscordBase_1.DiscordBase {
    get partnered() {
        if (!this.features) {
            return false;
        }
        return this.features.includes(v10_1.GuildFeature.Partnered);
    }
    /**
     * If the guild is verified.
     * @link https://discord.com/developers/docs/resources/guild#guild-object-guild-features
     */
    get verified() {
        if (!this.features) {
            return false;
        }
        return this.features.includes(v10_1.GuildFeature.Verified);
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
    iconURL(options) {
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
    splashURL(options) {
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
    bannerURL(options) {
        if (!this.banner) {
            return;
        }
        return this.rest.cdn.banners(this.id).get(this.banner, options);
    }
    toString() {
        return this.name;
    }
}
exports.BaseGuild = BaseGuild;
