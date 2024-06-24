import type { APIUser } from 'discord-api-types/v10';
import type { ReturnCache } from '../..';
import { fakePromise } from '../../common';
import { BaseResource } from './default/base';
import { Transformers, type UserStructure } from '../../client/transformers';

export class Users extends BaseResource<any, APIUser> {
	namespace = 'user';

	//@ts-expect-error
	filter(data: APIUser, id: string) {
		return true;
	}

	raw(id: string): ReturnCache<APIUser | undefined> {
		return super.get(id);
	}

	override get(id: string): ReturnCache<UserStructure | undefined> {
		return fakePromise(super.get(id)).then(rawUser => (rawUser ? Transformers.User(this.client, rawUser) : undefined));
	}

	override bulk(ids: string[]): ReturnCache<UserStructure[]> {
		return fakePromise(super.bulk(ids) as APIUser[]).then(users =>
			users.map(rawUser => Transformers.User(this.client, rawUser)),
		);
	}

	bulkRaw(ids: string[]): ReturnCache<APIUser[]> {
		return super.bulk(ids);
	}

	override values(): ReturnCache<UserStructure[]> {
		return fakePromise(super.values() as APIUser[]).then(users =>
			users.map(rawUser => Transformers.User(this.client, rawUser)),
		);
	}

	valuesRaw(): ReturnCache<APIUser[]> {
		return super.values();
	}
}
