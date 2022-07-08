import type { Model } from "./Base.ts";
import type { Snowflake } from "../Snowflake.ts";
import type { Session } from "../Session.ts";
import type { DiscordUser } from "../../discordeno/mod.ts";
import type { ImageFormat, ImageSize } from "../Util.ts";
import Util from "../Util.ts";
import * as Routes from "../Routes.ts";

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
        this.avatarHash = data.avatar ? Util.iconHashToBigInt(data.avatar) : undefined;
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
    avatarURL(options: { format?: ImageFormat; size?: ImageSize } = { size: 128 }) {
        let url: string;

        if (!this.avatarHash) {
            url = Routes.USER_DEFAULT_AVATAR(Number(this.discriminator) % 5);
        } else {
            url = Routes.USER_AVATAR(this.id, Util.iconBigintToHash(this.avatarHash));
        }

        return Util.formatImageURL(url, options.size, options.format);
    }

    toString() {
        return `<@${this.id}>`;
    }
}

export default User;
