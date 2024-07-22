import type { UsingClient } from '../commands';
import type { APIGuildPreview, APIPartialGuild } from '../types';
import { AnonymousGuild } from './AnonymousGuild';

/**
 * Represent Discord Guild Preview Object
 * @link https://discord.com/developers/docs/resources/guild#guild-preview-object
 */
export class GuildPreview extends AnonymousGuild {
	constructor(client: UsingClient, data: APIGuildPreview) {
		super(client, data as APIPartialGuild);
	}
}
