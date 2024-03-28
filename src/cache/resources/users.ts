import type { APIUser } from 'discord-api-types/v10';
import type { ReturnCache } from '../..';
import { fakePromise } from '../../common';
import { User } from '../../structures';
import { BaseResource } from './default/base';

export class Users extends BaseResource {
	namespace = 'user';

	override get(id: string): ReturnCache<User | undefined> {
		return fakePromise(super.get(id)).then(rawUser => (rawUser ? new User(this.client, rawUser) : undefined));
	}

	override bulk(ids: string[]): ReturnCache<User[]> {
		return fakePromise(super.bulk(ids) as APIUser[]).then(users =>
			users.map(rawUser => new User(this.client, rawUser)),
		);
	}

	override values(): ReturnCache<User[]> {
		return fakePromise(super.values() as APIUser[]).then(users => users.map(rawUser => new User(this.client, rawUser)));
	}
}
