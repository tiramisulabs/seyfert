import type { Model } from './Base.ts';
import type { Snowflake } from '../Snowflake.ts';
import type { Session } from '../Session.ts';
import type { DiscordMemberWithUser } from '../../discordeno/mod.ts';
import type { ImageFormat, ImageSize } from '../Util.ts';
import type { CreateGuildBan, ModifyGuildMember } from './guilds.ts';
import { Guild } from './guilds.ts';
import Util from '../Util.ts';
import User from './User.ts';
import * as Routes from '../Routes.ts';

/**
 * @link https://discord.com/developers/docs/resources/guild#guild-member-object
 * Represents a guild member
 */
export class Member implements Model {
    constructor(session: Session, data: DiscordMemberWithUser, guildId: Snowflake) {
        this.session = session;
        this.user = new User(session, data.user);
        this.guildId = guildId;
        this.avatarHash = data.avatar ? Util.iconHashToBigInt(data.avatar) : undefined;
        this.nickname = data.nick ? data.nick : undefined;
        this.premiumSince = data.premium_since ? Number.parseInt(data.premium_since) : undefined;
        this.joinedTimestamp = Number.parseInt(data.joined_at);
        this.roles = data.roles;
        this.deaf = !!data.deaf;
        this.mute = !!data.mute;
        this.pending = !!data.pending;
        this.communicationDisabledUntilTimestamp = data.communication_disabled_until
            ? Number.parseInt(data.communication_disabled_until)
            : undefined;
    }

    /** the session that instantiated this member */
    readonly session: Session;

    /** the user this guild member represents */
    user: User;

    /** the choosen guild id */
    guildId: Snowflake;

    /** the member's guild avatar hash optimized as a bigint */
    avatarHash?: bigint;

    /** this user's guild nickname */
    nickname?: string;

    /** when the user started boosting the guild */
    premiumSince?: number;

    /** when the user joined the guild */
    joinedTimestamp: number;

    /** array of role object ids */
    roles: Snowflake[];

    /** whether the user is deafened in voice channels */
    deaf: boolean;

    /** whether the user is muted in voice channels */
    mute: boolean;

    /** whether the user has not yet passed the guild's Membership Screening requirements */
    pending: boolean;

    /** when the user's timeout will expire and the user will be able to communicate in the guild again, null or a time in the past if the user is not timed out */
    communicationDisabledUntilTimestamp?: number;

    /** shorthand to User.id */
    get id(): Snowflake {
        return this.user.id;
    }

    /** gets the nickname or the username */
    get nicknameOrUsername(): string {
        return this.nickname ?? this.user.username;
    }

    /** gets the joinedAt timestamp as a Date */
    get joinedAt(): Date {
        return new Date(this.joinedTimestamp);
    }

    /** bans a member from this guild and delete previous messages sent by the member */
    async ban(options: CreateGuildBan): Promise<Member> {
        await Guild.prototype.banMember.call({ id: this.guildId, session: this.session }, this.user.id, options);

        return this;
    }

    /** kicks a member from this guild */
    async kick(options: { reason?: string }): Promise<Member> {
        await Guild.prototype.kickMember.call({ id: this.guildId, session: this.session }, this.user.id, options);

        return this;
    }

    /** unbans a member from this guild */
    async unban(): Promise<void> {
        await Guild.prototype.unbanMember.call({ id: this.guildId, session: this.session }, this.user.id);
    }

    /** edits member's nickname, roles, etc */
    async edit(options: ModifyGuildMember): Promise<Member> {
        const member = await Guild.prototype.editMember.call(
            { id: this.guildId, session: this.session },
            this.user.id,
            options,
        );

        return member;
    }

    /** adds a role to this member */
    async addRole(roleId: Snowflake, options: { reason?: string } = {}): Promise<void> {
        await Guild.prototype.addRole.call({ id: this.guildId, session: this.session }, this.user.id, roleId, options);
    }

    /** removes a role from this member */
    async removeRole(roleId: Snowflake, options: { reason?: string } = {}): Promise<void> {
        await Guild.prototype.removeRole.call(
            { id: this.guildId, session: this.session },
            this.user.id,
            roleId,
            options,
        );
    }

    /** gets the members's guild avatar, not to be confused with Member.user.avatarURL() */
    avatarURL(options: { format?: ImageFormat; size?: ImageSize } = { size: 128 }): string {
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

    toString(): string {
        return `<@!${this.user.id}>`;
    }
}

export default Member;
