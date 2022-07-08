import type { Model } from "./Base.ts";
import type { Snowflake } from "../Snowflake.ts";
import type { Session } from "../Session.ts";
import type { DiscordMemberWithUser } from "../../discordeno/mod.ts";
import type { ImageFormat, ImageSize } from "../Util.ts";
import type { CreateGuildBan, ModifyGuildMember } from "./guilds/Guild.ts";
import Util from "../Util.ts";
import User from "./User.ts";
import Guild from "./guilds/Guild.ts";
import * as Routes from "../Routes.ts";

/**
 * Represents a guild member
 * TODO: add a `guild` property somehow
 * @link https://discord.com/developers/docs/resources/guild#guild-member-object
 */
export class Member implements Model {
    constructor(session: Session, data: DiscordMemberWithUser, guildId: Snowflake) {
        this.session = session;
        this.user = new User(session, data.user);
        this.guildId = guildId;
        this.avatarHash = data.avatar ? Util.iconHashToBigInt(data.avatar) : undefined;
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
    guildId: Snowflake;
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

    async ban(options: CreateGuildBan): Promise<Member> {
        await Guild.prototype.banMember.call({ id: this.guildId, session: this.session }, this.user.id, options);

        return this;
    }

    async kick(options: { reason?: string }): Promise<Member> {
        await Guild.prototype.kickMember.call({ id: this.guildId, session: this.session }, this.user.id, options);

        return this;
    }

    async unban() {
        await Guild.prototype.unbanMember.call({ id: this.guildId, session: this.session }, this.user.id);
    }

    async edit(options: ModifyGuildMember): Promise<Member> {
        const member = await Guild.prototype.editMember.call(
            { id: this.guildId, session: this.session },
            this.user.id,
            options,
        );

        return member;
    }

    async addRole(roleId: Snowflake, options: { reason?: string } = {}) {
        await Guild.prototype.addRole.call({ id: this.guildId, session: this.session }, this.user.id, roleId, options);
    }

    async removeRole(roleId: Snowflake, options: { reason?: string } = {}) {
        await Guild.prototype.removeRole.call(
            { id: this.guildId, session: this.session },
            this.user.id,
            roleId,
            options,
        );
    }

    /** gets the user's avatar */
    avatarURL(options: { format?: ImageFormat; size?: ImageSize } = { size: 128 }) {
        let url: string;

        if (this.user.bot) {
            return this.user.avatarURL();
        }

        if (!this.avatarHash) {
            url = Routes.USER_DEFAULT_AVATAR(Number(this.user.discriminator) % 5);
        } else {
            url = Routes.USER_AVATAR(this.user.id, Util.iconBigintToHash(this.avatarHash));
        }

        return Util.formatImageURL(url, options.size, options.format);
    }

    toString() {
        return `<@!${this.user.id}>`;
    }
}

export default Member;
