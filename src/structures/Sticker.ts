import type { GuildStructure, RawFile, StickerStructure, UsingClient } from '..';
import type { Attachment, AttachmentBuilder } from '../builders';
import type { ReturnCache } from '../cache';
import { Transformers, type UserStructure } from '../client/transformers';
import type { MethodContext, ObjectToLower } from '../common';
import type { APISticker, RESTPatchAPIGuildStickerJSONBody, RESTPostAPIGuildStickerFormDataBody } from '../types';
import { DiscordBase } from './extra/DiscordBase';

export interface Sticker extends DiscordBase, ObjectToLower<Omit<APISticker, 'user'>> {}

export class Sticker extends DiscordBase {
	user?: UserStructure;
	constructor(client: UsingClient, data: APISticker) {
		super(client, data);
		if (data.user) {
			this.user = Transformers.User(this.client, data.user);
		}
	}

	guild(mode?: 'rest' | 'flow'): Promise<GuildStructure<'cached' | 'api'> | undefined>;
	guild(mode: 'cache'): ReturnCache<GuildStructure<'cached'> | undefined>;
	guild(mode: 'cache' | 'rest' | 'flow' = 'flow') {
		if (!this.guildId)
			return mode === 'cache' ? (this.client.cache.adapter.isAsync ? Promise.resolve() : undefined) : Promise.resolve();
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

	async edit(body: RESTPatchAPIGuildStickerJSONBody, reason?: string): Promise<StickerStructure | undefined> {
		if (!this.guildId) return;
		return this.client.guilds.stickers.edit(this.guildId, this.id, body, reason);
	}

	async fetch(force = false): Promise<StickerStructure | undefined> {
		if (!this.guildId) return;
		return this.client.guilds.stickers.fetch(this.guildId, this.id, force);
	}

	async delete(reason?: string) {
		if (!this.guildId) return;
		return this.client.guilds.stickers.delete(this.guildId, this.id, reason);
	}

	static methods({ client, guildId }: MethodContext<{ guildId: string }>) {
		return {
			list: (): Promise<StickerStructure[]> => client.guilds.stickers.list(guildId),
			create: (payload: CreateStickerBodyRequest, reason?: string): Promise<StickerStructure> =>
				client.guilds.stickers.create(guildId, payload, reason),
			edit: (stickerId: string, body: RESTPatchAPIGuildStickerJSONBody, reason?: string): Promise<StickerStructure> =>
				client.guilds.stickers.edit(guildId, stickerId, body, reason),
			fetch: (stickerId: string, force = false): Promise<StickerStructure> =>
				client.guilds.stickers.fetch(guildId, stickerId, force),
			delete: (stickerId: string, reason?: string) => client.guilds.stickers.delete(guildId, stickerId, reason),
		};
	}
}

export interface CreateStickerBodyRequest extends Omit<RESTPostAPIGuildStickerFormDataBody, 'file'> {
	file: Attachment | AttachmentBuilder | RawFile;
}
