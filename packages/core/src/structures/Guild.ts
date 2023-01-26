import type {
	APIGuild,
	GatewayGuildCreateDispatchData,
	GuildDefaultMessageNotifications,
	GuildNSFWLevel,
	GuildPremiumTier
} from 'discord-api-types/v10';
import type { Session } from '../session';
import { AnonymousGuild } from './AnonymousGuild';
import { GuildEmoji } from './GuildEmoji';
import { GuildMember } from './GuildMember';
import { Role } from './GuildRole';

export class Guild extends AnonymousGuild {
	constructor(
		session: Session,
		data: GatewayGuildCreateDispatchData | APIGuild
	) {
		super(session, data);
		this.ownerId = data.owner_id;
		this.nsfwLevel = data.nsfw_level;
		this.widgetEnabled = !!data.widget_enabled;
		this.defaultMessageNotificationLevel = data.default_message_notifications;
		this.premiumTier = data.premium_tier;
		this.premiumSubscriptionCount = data.premium_subscription_count;
		this.roles = new Map(
			data.roles.map((role) => [role.id, new Role(this.session, role, this.id)])
		);
		this.emojis = new Map(
			data.emojis.map((emoji) => [
				emoji.id!,
				new GuildEmoji(this.session, emoji, this.id)
			])
		);
		this.channels = [];

		this.gatewayPatch(data as GatewayGuildCreateDispatchData);
	}

	/**
	 * ID of the guild owner.
	 * There are servers that do not return this property
	 */
	ownerId: string;

	/**
	 * The guild's nsfw level.
	 * @link https://discord.com/developers/docs/resources/guild#guild-object-guild-nsfw-level
	 */
	nsfwLevel: GuildNSFWLevel;

	/** True if the server widget is enabled */
	widgetEnabled: boolean;

	/** The channel id that the widget will generate an invite to, or undefined if set to no invite. */
	widgetChannelId?: string;

	/**
	 * The default message notification level.
	 * @link https://discord.com/developers/docs/resources/guild#guild-object-default-message-notification-level
	 */
	defaultMessageNotificationLevel: GuildDefaultMessageNotifications;

	/**
	 * Premium tier (Server Boost level).
	 * @link https://discord.com/developers/docs/resources/guild#guild-object-premium-tier
	 */
	premiumTier: GuildPremiumTier;

	/** The number of boosts this guild currently has. */
	premiumSubscriptionCount?: number;

	/**
	 * A map with the guild's roles.
	 * @link https://discord.com/developers/docs/topics/permissions#role-object
	 */
	roles: Map<string, Role>;

	/**
	 * A map with the guild's emojis.
	 * @link https://discord.com/developers/docs/resources/emoji#emoji-object-emoji-structure
	 */
	emojis: Map<string, GuildEmoji>;

	/**
	 * A map with the guild's channels.
	 * @link https://discord.com/developers/docs/resources/channel#channel-object
	 */
	channels: any[]; // TODO

	/**
	 * A map with the guild's members.
	 * @link https://discord.com/developers/docs/resources/guild#guild-member-object
	 */
	members?: Map<string, GuildMember>;

	/**	When this guild was joined at */
	joinedTimestamp?: string;

	/** if this is considered a large guild */
	large?: boolean;

	/** if this guild is unavailable due to an outage */
	unavailable?: boolean;

	/** total number of members in this guild */
	memberCount?: number;

	/** Returns the maximum number of custom sticker slots */
	get maxStickers(): MaxStickers {
		switch (this.premiumTier) {
			case 1:
				return 15;
			case 2:
				return 30;
			case 3:
				return 60;
			default:
				return 5;
		}
	}

	/** Returns the maximum number of emoji slots */
	get maxEmojis(): MaxEmojis {
		switch (this.premiumTier) {
			case 1:
				return 100;
			case 2:
				return 150;
			case 3:
				return 250;
			default:
				return 50;
		}
	}

	get joinedAt(): Date | null {
		if (!this.joinedTimestamp) {
			return null;
		}
		return new Date(this.joinedTimestamp);
	}

	private gatewayPatch(data: GatewayGuildCreateDispatchData) {
		if ('members' in data && data.members.length) {
			this.members = new Map(
				data.members.map((member) => [
					`${member.user?.id}`,
					new GuildMember(this.session, member, this.id)
				])
			);
		}

		this.joinedTimestamp = data.joined_at;
		this.large = !!data.large;
		this.memberCount = data.member_count;
		this.unavailable = !!data.unavailable;
	}
}

/** Maximun custom guild emojis per level */
export type MaxEmojis = 50 | 100 | 150 | 250;

/** Maximun custom guild stickers per level */
export type MaxStickers = 5 | 15 | 30 | 60;
