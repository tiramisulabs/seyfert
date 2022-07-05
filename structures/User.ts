import type { Model } from "./Base.ts";
import type { Snowflake } from "../util/Snowflake.ts";
import type { Session } from "../session/Session.ts";
import type { DiscordUser } from "../vendor/external.ts";
import type { ImageFormat, ImageSize } from "../util/shared/images.ts";
import { iconBigintToHash, iconHashToBigInt } from "../util/hash.ts";
import { formatImageURL } from "../util/shared/images.ts";
import * as Routes from "../util/Routes.ts";

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
        this.avatar = data.avatar ? data.avatar : undefined;
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
    avatar?: string;
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
    avatarURL(options: { format?: ImageFormat; size?: ImageSize } = { size: 128 }) {
        let url: string;

        if (!this.avatarHash) {
            url = Routes.USER_DEFAULT_AVATAR(Number(this.discriminator) % 5);
        } else {
            url = Routes.USER_AVATAR(this.id, iconBigintToHash(this.avatarHash));
        }

        return formatImageURL(url, options.size, options.format);
    }

    toString() {
        return `<@${this.id}>`;
    }
}

export default User;
