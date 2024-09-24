import type { UsingClient } from '../../commands';
import { type Awaitable, fakePromise } from '../../common';
import { type AllChannels, channelFrom } from '../../structures';
import { type APIChannel, type APIThreadChannel, ChannelType } from '../../types';
import type { ReturnCache } from '../index';
import { GuildRelatedResource } from './default/guild-related';
import { ThreadsRelationShip } from './relationship/threads';

export class Channels extends GuildRelatedResource<any, APIChannel> {
	namespace = 'channel';

	threads = new ThreadsRelationShip(this.cache, this.client);

	__setClient(client: UsingClient): void {
		super.__setClient(client);
		this.threads.__setClient(client);
	}

	parse(data: APIChannel, id: string, guild_id: string) {
		const { permission_overwrites, ...rest } = super.parse(data, id, guild_id);
		return rest;
	}

	set(__keys: string, guild: string, data: APIChannel): ReturnCache<void>;
	set(__keys: [string, APIChannel][], guild: string): ReturnCache<void>;
	set(__keys: string | [string, APIChannel][], guild: string, data?: APIChannel): ReturnCache<void> {
		const keys = (Array.isArray(__keys) ? __keys : [[__keys, data]]).filter(x =>
			this.filter(x[1], x[0] as string, guild),
		) as [string, APIChannel][];
		return fakePromise(super.set(__keys as string, guild, data!)).then(() => {
			const threads = keys.filter(
				([_, channel]) =>
					[ChannelType.PublicThread, ChannelType.PrivateThread].includes(channel.type) && 'parent_id' in channel,
			) as [string, APIThreadChannel][];
			if (!threads.length) return;
			const maybePromises = threads.map(([_, thread]) => this.threads.add(thread.parent_id!, [thread.id]));
			return this.cache.adapter.isAsync ? (Promise.all(maybePromises) as never) : undefined;
		});
	}

	patch(__keys: string, guild?: string, data?: any): ReturnCache<void>;
	patch(__keys: [string, any][], guild?: string): ReturnCache<void>;
	patch(__keys: string | [string, any][], guild?: string, data?: any): ReturnCache<void> {
		const keys = (Array.isArray(__keys) ? __keys : [[__keys, data]]).filter(x => this.filter(x[1], x[0], guild)) as [
			string,
			any,
		][];
		return fakePromise(super.patch(__keys as string, guild, data)).then(() => {
			const threads = keys.filter(
				([_, channel]) =>
					[ChannelType.PublicThread, ChannelType.PrivateThread].includes(channel.type) && 'parent_id' in channel,
			) as [string, APIThreadChannel][];
			if (!threads.length) return;
			const maybePromises = threads.map(([_, thread]) => this.threads.add(thread.parent_id!, [thread.id]));
			return this.cache.adapter.isAsync ? (Promise.all(maybePromises) as never) : undefined;
		});
	}

	override get(id: string): ReturnCache<AllChannels | undefined> {
		return fakePromise(super.get(id)).then(rawChannel =>
			rawChannel ? channelFrom(rawChannel, this.client) : undefined,
		);
	}

	remove(id: string | string[], guild: string): Awaitable<void> {
		return fakePromise(super.remove(id, guild)).then(() => {
			const ids = Array.isArray(id) ? id : [id];
			const maybePromises = ids.map(x => this.threads.delete(x));
			return this.adapter.isAsync ? (Promise.all(maybePromises) as never) : undefined;
		});
	}

	raw(id: string): ReturnCache<Omit<APIChannel, 'permission_overwrites'> | undefined> {
		return super.get(id);
	}

	override bulk(ids: string[]): ReturnCache<ReturnType<typeof channelFrom>[]> {
		return fakePromise(super.bulk(ids)).then(channels =>
			channels.map(rawChannel => channelFrom(rawChannel, this.client)),
		);
	}

	bulkRaw(ids: string[]): ReturnCache<Omit<APIChannel, 'permission_overwrites'>[]> {
		return super.bulk(ids);
	}

	override values(guild: string): ReturnCache<ReturnType<typeof channelFrom>[]> {
		return fakePromise(super.values(guild)).then(channels =>
			channels.map(rawChannel => channelFrom(rawChannel, this.client)),
		);
	}

	valuesRaw(guild: string): ReturnCache<Omit<APIChannel, 'permission_overwrites'>[]> {
		return super.values(guild);
	}
}
