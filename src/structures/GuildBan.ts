import type { GuildBanStructure, GuildStructure } from '../client';
import type { UsingClient } from '../commands';
import { Formatter, type MethodContext, type ObjectToLower } from '../common';
import type { BanShorter } from '../common/shorters/bans';
import type { APIBan, RESTGetAPIGuildBansQuery } from '../types';
import { DiscordBase } from './extra/DiscordBase';

export interface GuildBan extends DiscordBase, ObjectToLower<Omit<APIBan, 'id'>> {}

export class GuildBan extends DiscordBase {
	constructor(
		client: UsingClient,
		data: APIBan,
		readonly guildId: string,
	) {
		super(client, { ...data, id: data.user.id });
	}

	create(body?: Parameters<BanShorter['create']>[2], reason?: string) {
		return this.client.bans.create(this.guildId, this.id, body, reason);
	}

	remove(reason?: string) {
		return this.client.bans.remove(this.guildId, this.id, reason);
	}

	guild(force = false): Promise<GuildStructure<'api'>> {
		return this.client.guilds.fetch(this.guildId, force);
	}

	fetch(force = false): Promise<GuildBanStructure> {
		return this.client.bans.fetch(this.guildId, this.id, force);
	}

	toString() {
		return Formatter.userMention(this.id);
	}

	static methods({ client, guildId }: MethodContext<{ guildId: string }>) {
		return {
			fetch: (userId: string, force = false): Promise<GuildBanStructure> => client.bans.fetch(guildId, userId, force),
			list: (query?: RESTGetAPIGuildBansQuery, force = false): Promise<GuildBanStructure[]> =>
				client.bans.list(guildId, query, force),
			create: (memberId: string, body?: Parameters<BanShorter['create']>[2], reason?: string) =>
				client.bans.create(guildId, memberId, body, reason),
			remove: (memberId: string, reason?: string) => client.bans.remove(guildId, memberId, reason),
			bulkCreate: (body: Parameters<BanShorter['bulkCreate']>[1], reason?: string) =>
				client.bans.bulkCreate(guildId, body, reason),
		};
	}
}
