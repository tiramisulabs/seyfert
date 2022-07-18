import type { Model } from "./Base.ts";
import type { Snowflake } from "../Snowflake.ts";
import type { Session } from "../Session.ts";
import type { DiscordUser, PremiumTypes, UserFlags } from "../../discordeno/mod.ts";
import type { ImageFormat, ImageSize } from "../Util.ts";
import Util from "../Util.ts";
import * as Routes from "../Routes.ts";

/**
 * @link https://discord.com/developers/docs/resources/user#user-object
 * Represents a user
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
        this.banner = data.banner ? Util.iconHashToBigInt(data.banner) : undefined;
        this.mfaEnabled = !!data.mfa_enabled;
        this.locale = data.locale;
        this.email = data.email ? data.email : undefined;
        this.verified = data.verified;
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

    /** the user's avatar hash optimized as a bigint */
    avatarHash?: bigint;

    /** the user's banner color encoded as an integer representation of hexadecimal color code */
    accentColor?: number;

    /** whether the user belongs to an OAuth2 application */
    bot: boolean;

    /** whether the user is an Official Discord System user (part of the urgent message system) */
    system: boolean;

    /** the user's banner hash optimized as a bigint */
    banner?: bigint;

    /** whether the user has two factor enabled on their account */
    mfaEnabled: boolean;

    /** the user's chosen language option */
    locale?: string;

    /** the user's email */
    email?: string;

    /** the flags on a user's account */
    flags?: UserFlags;

    /** whether the email on this account has been verified */
    verified?: boolean;

    /** the type of Nitro subscription on a user's account */
    premiumType?: PremiumTypes;

    /** the public flags on a user's account */
    publicFlags?: UserFlags;

    /** gets the user's username#discriminator */
    get tag(): string {
        return `${this.username}#${this.discriminator}}`;
    }

    /** fetches this user */
    fetch() {
        return this.session.fetchUser(this.id);
    }

    /** gets the user's avatar */
    avatarURL(options: { format?: ImageFormat; size?: ImageSize } = { size: 128 }): string {
        let url: string;

        if (!this.avatarHash) {
            url = Routes.USER_DEFAULT_AVATAR(Number(this.discriminator) % 5);
        } else {
            url = Routes.USER_AVATAR(this.id, Util.iconBigintToHash(this.avatarHash));
        }

        return Util.formatImageURL(url, options.size, options.format);
    }

    toString(): string {
        return `<@${this.id}>`;
    }
}

export default User;
