import { CacheFrom } from '../..';
import {
	type DMChannelStructure,
	type MessageStructure,
	Transformers,
	type UserStructure,
} from '../../client/transformers';
import { BaseChannel } from '../../structures';
import type { MessageCreateBodyRequest } from '../types/write';
import { BaseShorter } from './base';

export class UsersShorter extends BaseShorter {
	async createDM(userId: string, force = false): Promise<DMChannelStructure> {
		if (!force) {
			const dm = await this.client.cache.channels?.get(userId);
			if (dm) return dm as DMChannelStructure;
		}
		const data = await this.client.proxy.users('@me').channels.post({
			body: { recipient_id: userId },
		});
		await this.client.cache.channels?.set(CacheFrom.Rest, userId, '@me', data);
		return Transformers.DMChannel(this.client, data);
	}

	async deleteDM(userId: string, reason?: string): Promise<DMChannelStructure> {
		const res = await this.client.proxy.channels(userId).delete({ reason });
		await this.client.cache.channels?.removeIfNI(BaseChannel.__intent__('@me'), res.id, '@me');
		return Transformers.DMChannel(this.client, res);
	}

	async fetch(userId: string, force = false): Promise<UserStructure> {
		return Transformers.User(this.client, await this.raw(userId, force));
	}

	async raw(userId: string, force = false) {
		if (!force) {
			const user = await this.client.cache.users?.raw(userId);
			if (user) return user;
		}

		const data = await this.client.proxy.users(userId).get();
		await this.client.cache.users?.patch(CacheFrom.Rest, userId, data);
		return data;
	}

	async write(userId: string, body: MessageCreateBodyRequest): Promise<MessageStructure> {
		return (await this.client.users.createDM(userId)).messages.write(body);
	}
}
