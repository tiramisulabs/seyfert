import type { RawFile, UsingClient } from '..';
import type { Attachment, AttachmentBuilder } from '../builders';
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

	async guild(force = false) {
		if (!this.guildId) return;
		return this.client.guilds.fetch(this.guildId, force);
	}

	async edit(body: RESTPatchAPIGuildStickerJSONBody, reason?: string) {
		if (!this.guildId) return;
		return this.client.guilds.stickers.edit(this.guildId, this.id, body, reason);
	}

	async fetch(force = false) {
		if (!this.guildId) return;
		return this.client.guilds.stickers.fetch(this.guildId, this.id, force);
	}

	async delete(reason?: string) {
		if (!this.guildId) return;
		return this.client.guilds.stickers.delete(this.guildId, this.id, reason);
	}

	static methods({ client, guildId }: MethodContext<{ guildId: string }>) {
		return {
			list: () => client.guilds.stickers.list(guildId),
			create: (payload: CreateStickerBodyRequest, reason?: string) =>
				client.guilds.stickers.create(guildId, payload, reason),
			edit: (stickerId: string, body: RESTPatchAPIGuildStickerJSONBody, reason?: string) =>
				client.guilds.stickers.edit(guildId, stickerId, body, reason),
			fetch: (stickerId: string, force = false) => client.guilds.stickers.fetch(guildId, stickerId, force),
			delete: (stickerId: string, reason?: string) => client.guilds.stickers.delete(guildId, stickerId, reason),
		};
	}
}

export interface CreateStickerBodyRequest extends Omit<RESTPostAPIGuildStickerFormDataBody, 'file'> {
	file: Attachment | AttachmentBuilder | RawFile;
}
