import type { APIGuildMember } from '../../types';
import type { ReturnCache } from '../..';
import { fakePromise } from '../../common';
import { GuildBasedResource } from './default/guild-based';
import { type GuildMemberStructure, Transformers } from '../../client/transformers';
export class Members extends GuildBasedResource<any, APIGuildMember> {
	namespace = 'member';

	//@ts-expect-error
	filter(data: APIGuildMember, id: string, guild_id: string) {
		return true;
	}

	override parse(data: any, key: string, guild_id: string) {
		const { user, ...rest } = super.parse(data, data.user?.id ?? key, guild_id);
		return rest;
	}

	override get(id: string, guild: string): ReturnCache<GuildMemberStructure | undefined> {
		return fakePromise(super.get(id, guild)).then(rawMember =>
			fakePromise(this.client.cache.users?.raw(id)).then(user =>
				rawMember && user ? Transformers.GuildMember(this.client, rawMember, user, guild) : undefined,
			),
		);
	}

	raw(id: string, guild: string): ReturnCache<APIGuildMember | undefined> {
		return fakePromise(super.get(id, guild) as Omit<APIGuildMember, 'user'>).then(rawMember => {
			return fakePromise(this.client.cache.users?.raw(id)).then(user =>
				rawMember && user
					? {
							...rawMember,
							user,
						}
					: undefined,
			);
		});
	}

	override bulk(ids: string[], guild: string): ReturnCache<GuildMemberStructure[]> {
		return fakePromise(super.bulk(ids, guild)).then(members =>
			fakePromise(this.client.cache.users?.bulkRaw(ids)).then(
				users =>
					members
						.map(rawMember => {
							const user = users?.find(x => x.id === rawMember.id);
							return user ? Transformers.GuildMember(this.client, rawMember, user, guild) : undefined;
						})
						.filter(Boolean) as GuildMemberStructure[],
			),
		);
	}

	bulkRaw(ids: string[], guild: string): ReturnCache<Omit<APIGuildMember, 'user'>[]> {
		return super.bulk(ids, guild);
	}

	override values(guild: string): ReturnCache<GuildMemberStructure[]> {
		return fakePromise(super.values(guild)).then(members =>
			fakePromise(this.client.cache.users?.valuesRaw()).then(
				users =>
					members
						.map(rawMember => {
							const user = users?.find(x => x.id === rawMember.id);
							return user ? Transformers.GuildMember(this.client, rawMember, user, rawMember.guild_id) : undefined;
						})
						.filter(Boolean) as GuildMemberStructure[],
			),
		);
	}

	valuesRaw(guild: string): ReturnCache<Omit<APIGuildMember, 'user'>[]> {
		return super.values(guild);
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
