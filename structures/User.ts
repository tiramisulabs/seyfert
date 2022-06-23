import type { Model } from "./Base.ts";
import type { Snowflake } from "../util/Snowflake.ts";
import type { Session } from "../session/mod.ts";
import type { DiscordUser } from "../vendor/external.ts";
import { iconBigintToHash, iconHashToBigInt } from "../util/hash.ts";
import { Routes } from "../util/mod.ts";

/**
 * @link https://discord.com/developers/docs/reference#image-formatting
 */
export type ImageFormat = "jpg" | "jpeg" | "png" | "webp" | "gif" | "json";

/**
 * @link https://discord.com/developers/docs/reference#image-formatting
 */
export type ImageSize = 16 | 32 | 64 | 128 | 256 | 512 | 1024 | 2048 | 4096;

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
        this.avatarHash = data.avatar ? iconHashToBigInt(data.avatar) : undefined;
        this.accentColor = data.accent_color;
        this.bot = !!data.bot;
        this.system = !!data.system;
        this.banner = data.banner;
    }

    readonly session: Session;
    readonly id: Snowflake;

    username: string;
    discriminator: string;
    avatarHash?: bigint;
    accentColor?: number;
    bot: boolean;
    system: boolean;
    banner?: string;

    /** gets the user's username#discriminator */
    get tag() {
        return `${this.username}#${this.discriminator}}`;
    }

    /** gets the user's avatar */
    avatarUrl(options: { format?: ImageFormat; size?: ImageSize } = { size: 128 }) {
        let url: string;

        if (!this.avatarHash) {
            url = Routes.USER_DEFAULT_AVATAR(Number(this.discriminator) % 5);
        } else {
            url = Routes.USER_AVATAR(this.id, iconBigintToHash(this.avatarHash));
        }

        return `${url}.${options.format ?? (url.includes("/a_") ? "gif" : "jpg")}?size=${options.size}`;
    }
}
