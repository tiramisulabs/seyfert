import type { APIBan, GatewayGuildBanModifyDispatchData } from 'discord-api-types/v10';
import type { ReturnCache } from '../..';
import { fakePromise } from '../../common';
import { GuildBasedResource } from './default/guild-based';
import { type GuildBanStructure, Transformers } from '../../client/transformers';
export class Bans extends GuildBasedResource<any, GatewayGuildBanModifyDispatchData | APIBan> {
	namespace = 'ban';

	//@ts-expect-error
	filter(data: APIBan, id: string, guild_id: string) {
		return true;
	}

	override parse(data: any, key: string, guild_id: string) {
		const { user, ...rest } = super.parse(data, data.user?.id ?? key, guild_id);
		return rest;
	}

	override get(id: string, guild: string): ReturnCache<GuildBanStructure | undefined> {
		return fakePromise(super.get(id, guild)).then(rawBan =>
			rawBan ? Transformers.GuildBan(this.client, rawBan, guild) : undefined,
		);
	}

	raw(id: string, guild: string): ReturnCache<Omit<GatewayGuildBanModifyDispatchData | APIBan, 'user'> | undefined> {
		return super.get(id, guild);
	}

	override bulk(ids: string[], guild: string): ReturnCache<GuildBanStructure[]> {
		return fakePromise(super.bulk(ids, guild)).then(
			bans =>
				bans
					.map(rawBan => {
						return rawBan ? Transformers.GuildBan(this.client, rawBan, guild) : undefined;
					})
					.filter(Boolean) as GuildBanStructure[],
		);
	}

	bulkRaw(ids: string[], guild: string): ReturnCache<Omit<GatewayGuildBanModifyDispatchData | APIBan, 'user'>[]> {
		return fakePromise(super.bulk(ids, guild)).then(bans =>
			bans
				.map(rawBan => {
					return rawBan;
				})
				.filter(Boolean),
		);
	}

	override values(guild: string): ReturnCache<GuildBanStructure[]> {
		return fakePromise(super.values(guild)).then(
			bans =>
				bans
					.map(rawBan => {
						return rawBan ? Transformers.GuildBan(this.client, rawBan, guild) : undefined;
					})
					.filter(Boolean) as GuildBanStructure[],
		);
	}

	valuesRaw(guild: string): ReturnCache<Omit<GatewayGuildBanModifyDispatchData | APIBan, 'user'>[]> {
		return fakePromise(super.values(guild)).then(bans =>
			bans
				.map(rawBan => {
					return rawBan;
				})
				.filter(Boolean),
		);
	}
}
