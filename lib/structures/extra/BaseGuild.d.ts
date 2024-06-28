import { type APIPartialGuild } from 'discord-api-types/v10';
import type { ObjectToLower } from '../../common';
import type { ImageOptions } from '../../common/types/options';
import { DiscordBase } from './DiscordBase';
export interface BaseGuild extends ObjectToLower<APIPartialGuild> {
}
/**
 * Base guild class
 */
export declare class BaseGuild extends DiscordBase<APIPartialGuild> {
    get partnered(): boolean;
    /**
     * If the guild is verified.
     * @link https://discord.com/developers/docs/resources/guild#guild-object-guild-features
     */
    get verified(): boolean;
    /**
     * Fetch guild on API
     */
    fetch(): Promise<BaseGuild>;
    /**
     * iconURL gets the current guild icon.
     * @link https://discord.com/developers/docs/reference#image-formatting
     */
    iconURL(options?: ImageOptions): string | undefined;
    /**
     * splashURL gets the current guild splash as a string.
     * @link https://discord.com/developers/docs/reference#image-formatting
     * @param options - Image options for the splash url.
     * @returns Splash url or void.
     */
    splashURL(options?: ImageOptions): string | undefined;
    /**
     * bannerURL gets the current guild banner as a string.
     * @link https://discord.com/developers/docs/reference#image-formatting
     * @param options - Image options for the banner url.
     * @returns Banner url or void
     */
    bannerURL(options?: ImageOptions): string | undefined;
    toString(): string;
}
