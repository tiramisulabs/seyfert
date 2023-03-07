import type {
	APIGuildMember,
	GatewayGuildMemberAddDispatchData,
	GatewayGuildMemberUpdateDispatchData,
} from "discord-api-types/v10";
import type { Session } from "../session";
import type { ImageOptions } from "../";
import { DiscordBase } from "./extra/DiscordBase";
import { User } from "./User";

export type GuildMemberData = APIGuildMember | GatewayGuildMemberUpdateDispatchData | GatewayGuildMemberAddDispatchData;

/**
 * Represents a guild member
 * @link https://discord.com/developers/docs/resources/guild#guild-member-object
 */
export class GuildMember extends DiscordBase {
	constructor(
		session: Session,
		data: GuildMemberData,
		/** the choosen guild id */
		readonly guildId: string,
	) {
		super(session, data.user!.id);
		this.user = new User(session, data.user!);
		this.guildId = guildId;
		this.avatar = data.avatar ?? undefined;
		this.nickname = data.nick ?? undefined;
		this.premiumSince = Date.parse(data.premium_since ?? "");
		this.roles = data.roles;
		this.deaf = !!data.deaf;
		this.mute = !!data.mute;
		this.pending = !!data.pending;
		this.patch(data);
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
	joinedTimestamp?: number;

	/** array of role object ids */
	roles: string[];

	/** whether the user is deafened in voice channels */
	deaf: boolean;

	/** whether the user is muted in voice channels */
	mute: boolean;

	/** whether the user has not yet passed the guild's Membership Screening requirements */
	pending: boolean;

	/**
	 * when the user's timeout will expire and the user will be able to communicate in the guild again,
	 * null or a time in the past if the user is not timed out
	 */
	communicationDisabledUntilTimestamp?: number | null;

	/** gets the nickname or the username */
	get nicknameOrUsername(): string {
		return this.nickname ?? this.user.username;
	}

	/** gets the joinedAt timestamp as a Date */
	get joinedAt(): Date | null {
		if (!this.joinedTimestamp) {
			return null;
		}
		return new Date(this.joinedTimestamp);
	}

	dynamicAvatarURL(options?: ImageOptions): string | null {
		if (!this.avatar) {
			return this.user.avatarURL(options);
		}

		return this.session.managers.members.dynamicAvatarURL(this.guildId, this.id, this.avatar, options);
	}

	toString(): string {
		return `<@!${this.user.id}>`;
	}

	private patch(data: GuildMemberData) {
		if ("joined_at" in data && data.joined_at) {
			this.joinedTimestamp = Date.parse(data.joined_at);
		}
		if ("communication_disabled_until" in data) {
			this.communicationDisabledUntilTimestamp = data.communication_disabled_until?.length
				? Date.parse(data.communication_disabled_until)
				: null;
		}
	}
}
