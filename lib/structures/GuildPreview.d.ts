import type { APIGuildPreview } from 'discord-api-types/v10';
import type { UsingClient } from '../commands';
import { AnonymousGuild } from './AnonymousGuild';
/**
 * Represent Discord Guild Preview Object
 * @link https://discord.com/developers/docs/resources/guild#guild-preview-object
 */
export declare class GuildPreview extends AnonymousGuild {
    constructor(client: UsingClient, data: APIGuildPreview);
}
