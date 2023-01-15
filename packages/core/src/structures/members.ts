import type { Model } from './base';
import type { Snowflake } from '../snowflakes';
import type { Session } from '../biscuit';
import type {
	DiscordMemberWithUser,
	DiscordThreadMember,
} from '@biscuitland/api-types';
import type { CreateGuildBan, ModifyGuildMember } from './guilds';
import type { AvatarOptions } from './user';
import { User } from './user';
import { Guild } from './guilds';
import { Util } from '../utils/util';
import { USER_AVATAR, THREAD_USER } from '@biscuitland/api-types';
import { Permissions } from './special/permissions';

/**
 * Represents a guild member
 * @link https://discord.com/developers/docs/resources/guild#guild-member-object
 */
export class Member implements Model {
	constructor(
		session: Session,
		data: DiscordMemberWithUser,
		guildId: Snowflake
	) {
		this.session = session;
		this.user = new User(session, data.user);
		this.guildId = guildId;
		this.avatarHash = data.avatar
			? data.avatar
			: undefined;

		this.nickname = data.nick ? data.nick : undefined;
		this.premiumSince = data.premium_since
			? Date.parse(data.premium_since)
			: undefined;

		this.channelPermissions = data.permissions ? new Permissions(BigInt(data.permissions)) : undefined;
		this.joinedTimestamp = Date.parse(data.joined_at);
		this.roles = data.roles;
		this.deaf = !!data.deaf;
		this.mute = !!data.mute;
		this.pending = !!data.pending;
		this.communicationDisabledUntilTimestamp =
			data.communication_disabled_until
				? Date.parse(data.communication_disabled_until)
				: undefined;
	}

	/** the session that instantiated this member */
	readonly session: Session;

	/** the user this guild member represents */
	user: User;

	/** the choosen guild id */
	guildId: Snowflake;

	/** the member's guild avatar hash optimized as a bigint */
	avatarHash?: string;

	/** this user's guild nickname */
	nickname?: string;

	/** when the user started boosting the guild */
	premiumSince?: number;

	/** total permissions of the member in the channel, including overwrites, returned when in the interaction object */
	channelPermissions?: Permissions;

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
		await Guild.prototype.banMember.call(
			{ id: this.guildId, session: this.session },
			this.user.id,
			options
		);

		return this;
	}

	/** kicks a member from this guild */
	async kick(options: { reason?: string }): Promise<Member> {
		await Guild.prototype.kickMember.call(
			{ id: this.guildId, session: this.session },
			this.user.id,
			options.reason
		);

		return this;
	}

	/** unbans a member from this guild */
	async unban(): Promise<void> {
		await Guild.prototype.unbanMember.call(
			{ id: this.guildId, session: this.session },
			this.user.id
		);
	}

	/** edits member's nickname, roles, etc */
	async edit(options: ModifyGuildMember): Promise<Member> {
		const member = await Guild.prototype.editMember.call(
			{ id: this.guildId, session: this.session },
			this.user.id,
			options
		);

		return member;
	}

	/** calls {@link Member#edit} which calls {@link Guild#editMember} under the hood */
	async timeout(time: number | null) {
		await this.edit({ communicationDisabledUntil: time });
	}

	/** adds a role to this member */
	async addRole(roleId: Snowflake, reason?: string): Promise<void> {
		await Guild.prototype.addRole.call(
			{ id: this.guildId, session: this.session },
			this.user.id,
			roleId,
			reason
		);
	}

	/** removes a role from this member */
	async removeRole(
		roleId: Snowflake,
		options: { reason?: string } = {}
	): Promise<void> {
		await Guild.prototype.removeRole.call(
			{ id: this.guildId, session: this.session },
			this.user.id,
			roleId,
			options.reason
		);
	}

	async fetch(): Promise<Member> {
		const member = await Guild.prototype.fetchMember.call({ session: this.session, id: this.guildId }, this.id);

		return member;
	}

	/** gets the members's guild avatar if the user has one, gets the user's avatar instead */
	avatarURL(options: AvatarOptions): string {
		if (!this.avatarHash) {
			return this.user.avatarURL(options);
		}

		return Util.formatImageURL(USER_AVATAR(
			this.user.id,
			this.avatarHash
		), options.size ?? 128, options.format);
	}

	/**
	 * Sets a new nickname for this member. Same as Member.edit({ nick: ... })
	 * @param nick - The new nickname for the member.
	 */
	async setNickname(nick: string): Promise<Member> {
		return this.edit({ nick });
	}

	toString(): string {
		return `<@!${this.user.id}>`;
	}
}

/**
 * A member that comes from a thread
 * @link https://discord.com/developers/docs/resources/channel#thread-member-object
 * **/
export class ThreadMember implements Model {
	constructor(session: Session, data: DiscordThreadMember) {
		this.session = session;
		this.id = data.id;
		this.flags = data.flags;
		this.timestamp = Date.parse(data.join_timestamp);
	}

	readonly session: Session;
	readonly id: Snowflake;
	flags: number;
	timestamp: number;

	get threadId(): Snowflake {
		return this.id;
	}

	async quitThread(memberId?: Snowflake): Promise<void> {
		await this.session.rest.delete<undefined>(
			THREAD_USER(this.id, memberId ?? this.session.botId),
			{}
		);
	}

	async fetchMember(memberId?: Snowflake): Promise<ThreadMember> {
		const member = await this.session.rest.get<DiscordThreadMember>(
			THREAD_USER(this.id, memberId ?? this.session.botId)
		);

		return new ThreadMember(this.session, member);
	}
}
