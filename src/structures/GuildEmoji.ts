import type { APIEmoji, RESTPatchAPIChannelJSONBody, RESTPatchAPIGuildEmojiJSONBody } from 'discord-api-types/v10';
import type { BaseCDNUrlOptions } from '../api';
import type { UsingClient } from '../commands';
import { Formatter, type EmojiShorter, type MethodContext, type ObjectToLower } from '../common';
import { DiscordBase } from './extra/DiscordBase';

export interface GuildEmoji extends DiscordBase, ObjectToLower<Omit<APIEmoji, 'id'>> {}

export class GuildEmoji extends DiscordBase {
	constructor(
		client: UsingClient,
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
		return this.client.emojis.edit(this.guildId, this.id, body, reason);
	}

	delete(reason?: string) {
		return this.client.emojis.delete(this.guildId, this.id, reason);
	}

	fetch(force = false) {
		return this.client.emojis.fetch(this.guildId, this.id, force);
	}

	url(options?: BaseCDNUrlOptions) {
		return this.rest.cdn.emojis(this.id).get(options);
	}

	toString() {
		return Formatter.emojiMention(this.id, this.name, this.animated);
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
				client.emojis.edit(guildId, emojiId, body, reason),
			create: (body: Parameters<EmojiShorter['create']>[1]) => client.emojis.create(guildId, body),
			fetch: (emojiId: string, force = false) => client.emojis.fetch(guildId, emojiId, force),
			list: (force = false) => client.emojis.list(guildId, force),
		};
	}
}
