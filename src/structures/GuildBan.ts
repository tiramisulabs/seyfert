import type { APIBan, RESTGetAPIGuildBansQuery } from 'discord-api-types/v10';
import type { UsingClient } from '../commands';
import type { MethodContext, ObjectToLower } from '../common';
import { DiscordBase } from './extra/DiscordBase';
import type { BanShorter } from '../common/shorters/bans';

export interface GuildBan extends DiscordBase, ObjectToLower<Omit<APIBan, 'id'>> {}

export class GuildBan extends DiscordBase {
	constructor(
		client: UsingClient,
		data: APIBan,
		readonly guildId: string,
	) {
		super(client, { ...data, id: data.user.id });
	}

	guild(force = false) {
		return this.client.guilds.fetch(this.guildId, force);
	}

	fetch(force = false) {
		return this.client.bans.fetch(this.guildId, this.id, force);
	}

	toString() {
		return `<@${this.id}>`;
	}

	static methods({ client, guildId }: MethodContext<{ guildId: string }>) {
		return {
			fetch: (userId: string, force = false) => client.bans.fetch(guildId, userId, force),
			list: (query?: RESTGetAPIGuildBansQuery, force = false) => client.bans.list(guildId, query, force),
			create: (memberId: string, body?: Parameters<BanShorter['create']>[2], reason?: string) =>
				client.bans.create(guildId, memberId, body, reason),
			remove: (memberId: string, reason?: string) => client.bans.remove(guildId, memberId, reason),
			bulkCreate: (body: Parameters<BanShorter['bulkCreate']>[1], reason?: string) =>
				client.bans.bulkCreate(guildId, body, reason),
		};
	}
}
