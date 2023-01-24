import type { APIGuild, GuildDefaultMessageNotifications, GuildPremiumTier } from 'discord-api-types/v10';
import type { Session } from '../session';
import { AnonymousGuild } from './AnonymousGuild';


export class Guild extends AnonymousGuild {
	constructor(session: Session, data: APIGuild) {
		super(session, data);
		this.ownerId = data.owner_id;
		this.widgetEnabled = !!data.widget_enabled;
		this.defaultMessageNotificationLevel = data.default_message_notifications;
		this.premiumTier = data.premium_tier;
		this.members = [];
		this.roles = [];
		this.emojis = [];
		this.channels = [];
	}

	/**
	 * ID of the guild owner.
	 * There are servers that do not return this property
	 */
	ownerId: string;

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

	/**
	 * A map with the guild's members.
	 * @link https://discord.com/developers/docs/resources/guild#guild-member-object
	 */
	members: any[]; // TODO

	/**
	 * A map with the guild's roles.
	 * @link https://discord.com/developers/docs/topics/permissions#role-object
	 */
	roles: any[];// TODO

	/**
	 * A map with the guild's emojis.
	 * @link https://discord.com/developers/docs/resources/emoji#emoji-object-emoji-structure
	 */
	emojis: any[];// TODO

	/**
	 * A map with the guild's channels.
	 * @link https://discord.com/developers/docs/resources/channel#channel-object
	 */
	channels: any[]; // TODO

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
}

/** Maximun custom guild emojis per level */
export type MaxEmojis = 50 | 100 | 150 | 250;

/** Maximun custom guild stickers per level */
export type MaxStickers = 5 | 15 | 30 | 60;
