import type { BaseImageURLOptions } from '../api';
import type { BaseClient } from '../client/base';
import type {
	APIEmoji,
	GuildShorter,
	MethodContext,
	ObjectToLower,
	RESTPatchAPIChannelJSONBody,
	RESTPatchAPIGuildEmojiJSONBody,
} from '../common';
import { DiscordBase } from './extra/DiscordBase';

export interface GuildEmoji extends DiscordBase, ObjectToLower<Omit<APIEmoji, 'id'>> {}

export class GuildEmoji extends DiscordBase {
	constructor(
		client: BaseClient,
		data: APIEmoji,
		readonly guildId: string,
	) {
		super(client, { ...data, id: data.id! });
	}

	guild(force = false) {
		if (!this.guildId) return;
		return this.client.guilds.fetch(this.guildId, force);
	}

	edit(body: RESTPatchAPIChannelJSONBody, reason?: string) {
		return this.client.guilds.emojis.edit(this.guildId, this.id, body, reason);
	}

	delete(reason?: string) {
		return this.client.guilds.emojis.delete(this.guildId, this.id, reason);
	}

	fetch(force = false) {
		return this.client.guilds.emojis.fetch(this.guildId, this.id, force);
	}

	url(options?: BaseImageURLOptions) {
		return this.rest.cdn.emoji(this.id, options);
	}

	toString() {
		return `<${this.animated ? 'a' : ''}:${this.name}:${this.id}>`;
	}

	toJSON() {
		return {
			id: this.id,
			name: this.name,
			animated: !!this.animated,
		};
	}

	static methods({ client, guildId }: MethodContext<{ guildId: string }>) {
		return {
			edit: (emojiId: string, body: RESTPatchAPIGuildEmojiJSONBody, reason?: string) =>
				client.guilds.emojis.edit(guildId, emojiId, body, reason),
			create: (body: Parameters<GuildShorter['emojis']['create']>[1]) => client.guilds.emojis.create(guildId, body),
			fetch: (emojiId: string, force = false) => client.guilds.emojis.fetch(guildId, emojiId, force),
			list: (force = false) => client.guilds.emojis.list(guildId, force),
		};
	}
}
