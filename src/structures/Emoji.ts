import type { BaseCDNUrlOptions } from '../api';
import type { ReturnCache } from '../cache';
import {
	type ApplicationEmojiStructure,
	type GuildEmojiStructure,
	type GuildStructure,
	Transformers,
	type UserStructure,
} from '../client';
import type { UsingClient } from '../commands';
import { type EmojiShorter, Formatter, type MethodContext, type ObjectToLower, type When } from '../common';
import type {
	APIApplicationEmoji,
	APIEmoji,
	RESTPatchAPIApplicationEmojiJSONBody,
	RESTPatchAPIGuildEmojiJSONBody,
} from '../types';
import { DiscordBase } from './extra/DiscordBase';

export interface Emoji extends DiscordBase, ObjectToLower<Omit<APIEmoji, 'id' | 'user'>> {}

export class Emoji<T extends boolean = false> extends DiscordBase {
	user: When<T, UserStructure>;
	constructor(client: UsingClient, data: APIEmoji) {
		super(client, { ...data, id: data.id! });
		this.user = (data.user && Transformers.User(client, data.user)) as never;
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
}

export interface GuildEmoji extends Emoji {}

export class GuildEmoji extends Emoji {
	constructor(
		client: UsingClient,
		data: APIEmoji,
		readonly guildId: string,
	) {
		super(client, data);
	}

	guild(mode?: 'rest' | 'flow'): Promise<GuildStructure<'cached' | 'api'>>;
	guild(mode: 'cache'): ReturnCache<GuildStructure<'cached'> | undefined>;
	guild(mode: 'cache' | 'rest' | 'flow' = 'flow'): unknown {
		switch (mode) {
			case 'cache':
				return (
					this.client.cache.guilds?.get(this.guildId) ||
					(this.client.cache.adapter.isAsync ? (Promise.resolve() as any) : undefined)
				);
			default:
				return this.client.guilds.fetch(this.guildId, mode === 'rest');
		}
	}

	edit(body: RESTPatchAPIGuildEmojiJSONBody, reason?: string): Promise<GuildEmojiStructure> {
		return this.client.emojis.edit(this.guildId, this.id, body, reason);
	}

	delete(reason?: string) {
		return this.client.emojis.delete(this.guildId, this.id, reason);
	}

	fetch(force = false): Promise<GuildEmojiStructure> {
		return this.client.emojis.fetch(this.guildId, this.id, force);
	}

	static methods({ client, guildId }: MethodContext<{ guildId: string }>) {
		return {
			edit: (emojiId: string, body: RESTPatchAPIGuildEmojiJSONBody, reason?: string): Promise<GuildEmojiStructure> =>
				client.emojis.edit(guildId, emojiId, body, reason),
			create: (body: Parameters<EmojiShorter['create']>[1]): Promise<GuildEmojiStructure> =>
				client.emojis.create(guildId, body),
			fetch: (emojiId: string, force = false): Promise<GuildEmojiStructure> =>
				client.emojis.fetch(guildId, emojiId, force),
			list: (force = false): Promise<GuildEmojiStructure[]> => client.emojis.list(guildId, force),
		};
	}
}

export class ApplicationEmoji extends Emoji<true> {
	constructor(client: UsingClient, data: APIApplicationEmoji) {
		super(client, data);
	}

	fetch(): Promise<ApplicationEmojiStructure> {
		return this.client.applications.getEmoji(this.id);
	}

	edit(body: RESTPatchAPIApplicationEmojiJSONBody): Promise<ApplicationEmojiStructure> {
		return this.client.applications.editEmoji(this.id, body);
	}

	delete() {
		return this.client.applications.deleteEmoji(this.id);
	}
}
