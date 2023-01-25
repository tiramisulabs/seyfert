import type { APIGuildMember } from 'discord-api-types/v10';
import type { Session } from '../session';
import type { ImageOptions } from '../utils/types';
import { Base } from './extra/base';
import { User } from './User';

/**
 * Represents a guild member
 * @link https://discord.com/developers/docs/resources/guild#guild-member-object
 */
export class Member extends Base {
	constructor(
		session: Session,
		data: APIGuildMember,
		/** the choosen guild id */
		readonly guildId: string
	) {
		super(session, data.user!.id);
		this.user = new User(session, data.user!);
		this.guildId = guildId;
		this.avatar = data.avatar ?? undefined;
		this.nickname = data.nick ?? undefined;
		this.joinedTimestamp = Date.parse(data.joined_at);
		this.premiumSince = Date.parse(data.premium_since ?? '');
		this.roles = data.roles;
		this.deaf = !!data.deaf;
		this.mute = !!data.mute;
		this.pending = !!data.pending;
		this.communicationDisabledUntilTimestamp = Date.parse(
			data.communication_disabled_until ?? ''
		);
	}

	/** the user this guild member represents */
	user: User;

	/** the member's guild avatar hash */
	avatar?: string;

	/** this user's guild nickname */
	nickname?: string;

	/** when the user started boosting the guild */
	premiumSince?: number;

	/** when the user joined the guild */
	joinedTimestamp: number;

	/** array of role object ids */
	roles: string[];

	/** whether the user is deafened in voice channels */
	deaf: boolean;

	/** whether the user is muted in voice channels */
	mute: boolean;

	/** whether the user has not yet passed the guild's Membership Screening requirements */
	pending: boolean;

	/** when the user's timeout will expire and the user will be able to communicate in the guild again, null or a time in the past if the user is not timed out */
	communicationDisabledUntilTimestamp?: number;

	/** gets the nickname or the username */
	get nicknameOrUsername(): string {
		return this.nickname ?? this.user.username;
	}

	/** gets the joinedAt timestamp as a Date */
	get joinedAt(): Date {
		return new Date(this.joinedTimestamp);
	}

	dynamicAvatarURL(options?: ImageOptions): string {
		if (!this.avatar) {
			return this.user.avatarURL(options);
		}
		return this.session.utils.formatImageURL(
			this.session.cdn
				.guilds(this.guildId)
				.users(this.id)
				.avatars(this.avatar)
				.get(),
			options?.size,
			options?.format
		);
	}

	toString(): string {
		return `<@!${this.user.id}>`;
	}
}
