import type { APIGuild, APIGuildPreview } from 'discord-api-types/v10';
import type { Session } from '../session';
import { AnonymousGuild } from './AnonymousGuild';

/**
 * Represent Discord Guild Preview Object
 * @link https://discord.com/developers/docs/resources/guild#guild-preview-object
 */
export class GuildPreview extends AnonymousGuild {
	constructor(session: Session, data: APIGuildPreview) {
		super(session, data as APIGuild);
		this.emojis = [];
		this.stickers = [];
		this.discoverySplash = data.discovery_splash ?? undefined;
		this.approximateMemberCount = data.approximate_member_count;
		this.approximatePresenceCount = data.approximate_presence_count;
	}

	emojis: any[];// TODO
	stickers: any[];// TODO
	/** The guild's discovery splash hash */
	discoverySplash?: string;
	/** approximate number of members in this guild */
	approximateMemberCount: number;
	/** approximate number of online members in this guild */
	approximatePresenceCount: number;
}
