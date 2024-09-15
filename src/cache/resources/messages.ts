import type { MessageData, ReturnCache } from '../..';
import { type MessageStructure, Transformers } from '../../client/transformers';
import { fakePromise } from '../../common';
import type { APIMessage, APIUser } from '../../types';
import { GuildRelatedResource } from './default/guild-related';

export class Messages extends GuildRelatedResource<any, APIMessage> {
	namespace = 'message';

	//@ts-expect-error
	filter(data: MessageData, id: string, channel_id?: string) {
		return true;
	}

	override parse(data: any, _key: string, _channel_id: string) {
		const { author, member, ...rest } = data;
		if (author?.id) rest.user_id = author.id;

		return rest;
	}

	override get(id: string): ReturnCache<MessageStructure | undefined> {
		return fakePromise(super.get(id) as APIMessageResource | undefined).then(rawMessage => {
			return this.cache.users && rawMessage?.user_id
				? fakePromise(this.cache.adapter.get(this.cache.users.hashId(rawMessage.user_id)) as APIUser | undefined).then(
						user => {
							return user ? Transformers.Message(this.client, { ...rawMessage!, author: user }) : undefined;
						},
					)
				: undefined;
		});
	}

	raw(id: string): ReturnCache<APIMessageResource | undefined> {
		return super.get(id);
	}

	override bulk(ids: string[]): ReturnCache<MessageStructure[]> {
		return fakePromise(super.bulk(ids) as APIMessageResource[]).then(
			messages =>
				messages
					.map(rawMessage => {
						return this.cache.users && rawMessage?.user_id
							? fakePromise(
									this.cache.adapter.get(this.cache.users.hashId(rawMessage.user_id)) as APIUser | undefined,
								).then(user => {
									return user ? Transformers.Message(this.client, { ...rawMessage!, author: user }) : undefined;
								})
							: undefined;
					})
					.filter(Boolean) as MessageStructure[],
		);
	}

	bulkRaw(ids: string[]): ReturnCache<APIMessageResource[]> {
		return super.bulk(ids);
	}

	override values(channel: string): ReturnCache<MessageStructure[]> {
		return fakePromise(super.values(channel) as APIMessageResource[]).then(messages => {
			const hashes: (string | undefined)[] = this.cache.users
				? messages.map(x => (x.user_id ? this.cache.users!.hashId(x.user_id) : undefined))
				: [];
			return fakePromise(this.cache.adapter.bulkGet(hashes.filter(Boolean) as string[]) as APIUser[]).then(users => {
				return messages
					.map(message => {
						const user = users.find(user => user.id === message.user_id);
						return user ? Transformers.Message(this.client, { ...message, author: user }) : undefined;
					})
					.filter(Boolean) as MessageStructure[];
			});
		});
	}

	valuesRaw(channel: string): ReturnCache<APIMessageResource[]> {
		return super.values(channel);
	}

	keys(channel: string) {
		return super.keys(channel);
	}
}

export type APIMessageResource = Omit<APIMessage, 'author' | 'member'> & { user_id?: string };
