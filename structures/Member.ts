import type { Model } from "./Base.ts";
import type { Snowflake } from "../util/Snowflake.ts";
import type { Session } from "../session/Session.ts";
import type { DiscordMember, MakeRequired } from "../vendor/external.ts";
import type { ImageFormat, ImageSize } from "../util/shared/images.ts";
import { iconBigintToHash, iconHashToBigInt } from "../util/hash.ts";
import { Routes } from "../util/mod.ts";
import { User } from "./User.ts";

/**
 * @link https://discord.com/developers/docs/resources/guild#create-guild-ban
 */
export interface CreateGuildBan {
    /** Number of days to delete messages for (0-7) */
    deleteMessageDays?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
    /** Reason for the ban */
    reason?: string;
}

/**
 * Represents a guild member
 * TODO: add a `guild` property somehow
 * @link https://discord.com/developers/docs/resources/guild#guild-member-object
 */
export class Member implements Model {
    constructor(session: Session, data: MakeRequired<DiscordMember, "user">) {
        this.session = session;
        this.user = new User(session, data.user);
        this.avatarHash = data.avatar ? iconHashToBigInt(data.avatar) : undefined;
        this.nickname = data.nick ? data.nick : undefined;
        this.joinedTimestamp = Number.parseInt(data.joined_at);
        this.roles = data.roles;
        this.deaf = !!data.deaf;
        this.mute = !!data.mute;
        this.pending = !!data.pending;
        this.communicationDisabledUntilTimestamp = data.communication_disabled_until
            ? Number.parseInt(data.communication_disabled_until)
            : undefined;
    }

    readonly session: Session;

    user: User;
    avatarHash?: bigint;
    nickname?: string;
    joinedTimestamp: number;
    roles: Snowflake[];
    deaf: boolean;
    mute: boolean;
    pending: boolean;
    communicationDisabledUntilTimestamp?: number;

    /** shorthand to User.id */
    get id(): Snowflake {
        return this.user.id;
    }

    get nicknameOrUsername() {
        return this.nickname ?? this.user.username;
    }

    get joinedAt() {
        return new Date(this.joinedTimestamp);
    }

    /**
     * Bans the member
     */
    async ban(guildId: Snowflake, options: CreateGuildBan): Promise<Member> {
        await this.session.rest.runMethod<undefined>(
            this.session.rest,
            "PUT",
            Routes.GUILD_BAN(guildId, this.id),
            options
                ? {
                    delete_message_days: options.deleteMessageDays,
                    reason: options.reason,
                }
                : {},
        );

        return this;
    }

    /**
     * Kicks the member
     */
    async kick(guildId: Snowflake, { reason }: { reason?: string }): Promise<Member> {
        await this.session.rest.runMethod<undefined>(
            this.session.rest,
            "DELETE",
            Routes.GUILD_MEMBER(guildId, this.id),
            { reason },
        );

        return this;
    }

    /** gets the user's avatar */
    avatarUrl(options: { format?: ImageFormat; size?: ImageSize } = { size: 128 }) {
        let url: string;

        if (!this.avatarHash) {
            url = Routes.USER_DEFAULT_AVATAR(Number(this.user.discriminator) % 5);
        } else {
            url = Routes.USER_AVATAR(this.id, iconBigintToHash(this.avatarHash));
        }

        return `${url}.${options.format ?? (url.includes("/a_") ? "gif" : "jpg")}?size=${options.size}`;
    }

    toString() {
        return `<@!${this.user.id}>`;
    }
}
