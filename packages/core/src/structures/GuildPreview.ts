import type { APIGuildPreview, APIPartialGuild } from 'discord-api-types/v10';
import type { Session } from '../session';
import { AnonymousGuild } from './AnonymousGuild';
import { GuildEmoji } from './GuildEmoji';
import { Sticker } from './Sticker';

/**
 * Represent Discord Guild Preview Object
 * @link https://discord.com/developers/docs/resources/guild#guild-preview-object
 */
export class GuildPreview extends AnonymousGuild {
	constructor(session: Session, data: APIGuildPreview) {
		super(session, data as APIPartialGuild);
		this.emojis = data.emojis.map(
			(emoji) => new GuildEmoji(this.session, emoji, this.id)
		);
		this.stickers = data.stickers.map(
			(sticker) => new Sticker(this.session, sticker)
		);
		this.discoverySplash = data.discovery_splash ?? undefined;
		this.approximateMemberCount = data.approximate_member_count;
		this.approximatePresenceCount = data.approximate_presence_count;
	}

	/** custom guild emojis */
	emojis: GuildEmoji[];

	/** custom guild stickers */
	stickers: Sticker[];

	/** The guild's discovery splash hash */
	discoverySplash?: string;

	/** approximate number of members in this guild */
	approximateMemberCount: number;

	/** approximate number of online members in this guild */
	approximatePresenceCount: number;
}
