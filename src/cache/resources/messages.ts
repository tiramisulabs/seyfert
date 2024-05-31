import type { APIMessage, APIUser } from 'discord-api-types/v10';
import { GuildRelatedResource } from './default/guild-related';
import type { MessageData, ReturnCache } from '../..';
import { fakePromise } from '../../common';
import { Message } from '../../structures';

export class Messages extends GuildRelatedResource {
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

	override get(id: string): ReturnCache<Message | undefined> {
		return fakePromise(super.get(id) as APIMessageResource | undefined).then(rawMessage => {
			return this.cache.users && rawMessage?.user_id
				? fakePromise(this.cache.adapter.get(this.cache.users.hashId(rawMessage.user_id)) as APIUser | undefined).then(
						user => {
							return user ? new Message(this.client, { ...rawMessage!, author: user }) : undefined;
						},
					)
				: undefined;
		});
	}

	override bulk(ids: string[]): ReturnCache<Message[]> {
		return fakePromise(super.bulk(ids) as APIMessageResource[]).then(
			messages =>
				messages
					.map(rawMessage => {
						return this.cache.users && rawMessage?.user_id
							? fakePromise(
									this.cache.adapter.get(this.cache.users.hashId(rawMessage.user_id)) as APIUser | undefined,
								).then(user => {
									return user ? new Message(this.client, { ...rawMessage!, author: user }) : undefined;
								})
							: undefined;
					})
					.filter(Boolean) as Message[],
		);
	}

	override values(guild: string): ReturnCache<Message[]> {
		return fakePromise(super.values(guild) as APIMessageResource[]).then(messages => {
			const hashes: (string | undefined)[] = this.cache.users
				? messages.map(x => (x.user_id ? this.cache.users!.hashId(x.user_id) : undefined))
				: [];
			return fakePromise(this.cache.adapter.get(hashes.filter(Boolean) as string[]) as APIUser[]).then(users => {
				return messages
					.map(message => {
						const user = users.find(user => user.id === message.user_id);
						return user ? new Message(this.client, { ...message, author: user }) : undefined;
					})
					.filter(Boolean) as Message[];
			});
		});
	}
}

export type APIMessageResource = Omit<APIMessage, 'author'> & { user_id?: string };
