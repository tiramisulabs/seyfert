import type { ReturnCache } from '../..';
import { fakePromise } from '../../common';
import { GuildMember } from '../../structures';
import { GuildBasedResource } from './default/guild-based';
export class Members extends GuildBasedResource {
	namespace = 'member';

	override parse(data: any, key: string, guild_id: string) {
		const { user, ...rest } = super.parse(data, data.user?.id ?? key, guild_id);
		return rest;
	}

	override get(id: string, guild: string): ReturnCache<GuildMember | undefined> {
		return fakePromise(super.get(id, guild)).then(rawMember =>
			fakePromise(this.client.cache.users?.get(id)).then(user =>
				rawMember && user ? new GuildMember(this.client, rawMember, user, guild) : undefined,
			),
		);
	}

	override bulk(ids: string[], guild: string): ReturnCache<GuildMember[]> {
		return fakePromise(super.bulk(ids, guild)).then(members =>
			fakePromise(this.client.cache.users?.bulk(ids) ?? []).then(
				users =>
					members
						.map(rawMember => {
							const user = users.find(x => x.id === rawMember.id);
							return user ? new GuildMember(this.client, rawMember, user, guild) : undefined;
						})
						.filter(Boolean) as GuildMember[],
			),
		);
	}

	override values(guild: string): ReturnCache<GuildMember[]> {
		return fakePromise(super.values(guild)).then(members =>
			fakePromise(this.client.cache.users?.values() ?? []).then(
				users =>
					members
						.map(rawMember => {
							const user = users.find(x => x.id === rawMember.id);
							return user ? new GuildMember(this.client, rawMember, user, rawMember.guild_id) : undefined;
						})
						.filter(Boolean) as GuildMember[],
			),
		);
	}

	override async set(memberId: string, guildId: string, data: any): Promise<void>;
	override async set(memberId_dataArray: [string, any][], guildId: string): Promise<void>;
	override async set(__keys: string | [string, any][], guild: string, data?: any) {
		const keys: [string, any][] = Array.isArray(__keys) ? __keys : [[__keys, data]];
		const bulkData: (['members', any, string, string] | ['users', any, string])[] = [];

		for (const [id, value] of keys) {
			if (value.user) {
				bulkData.push(['members', value, id, guild]);
				bulkData.push(['users', value.user, id]);
			}
		}

		await this.cache.bulkSet(bulkData);
	}
}
