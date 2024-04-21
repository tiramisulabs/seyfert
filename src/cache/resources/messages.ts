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
		rest.user_id = author.id;

		return rest;
	}

	override get(id: string): ReturnCache<Message | undefined> {
		return fakePromise(super.get(id) as APIMessageResource).then(rawMessage => {
			const user = this.cache.users
				? (this.cache.adapter.get(this.cache.users.hashId(rawMessage.user_id)) as APIUser | undefined)
				: undefined;
			return user ? new Message(this.client, { ...rawMessage, author: user }) : undefined;
		});
	}

	override bulk(ids: string[]): ReturnCache<Message[]> {
		return fakePromise(super.bulk(ids) as APIMessageResource[]).then(
			messages =>
				messages
					.map(rawMessage => {
						const user = this.cache.users
							? (this.cache.adapter.get(this.cache.users.hashId(rawMessage.user_id)) as APIUser | undefined)
							: undefined;
						return user ? new Message(this.client, { ...rawMessage, author: user }) : undefined;
					})
					.filter(Boolean) as Message[],
		);
	}

	override values(guild: string): ReturnCache<Message[]> {
		return fakePromise(super.values(guild) as APIMessageResource[]).then(messages => {
			const hashes: string[] = this.cache.users ? messages.map(x => this.cache.users!.hashId(x.user_id)) : [];
			return fakePromise(this.cache.adapter.get(hashes) as APIUser[]).then(users => {
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

export type APIMessageResource = Omit<APIMessage, 'author'> & { user_id: string };
