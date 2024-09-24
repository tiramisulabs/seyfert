import { fakePromise } from '../../../common';
import { BaseRelationShip } from './base';

export class ThreadsRelationShip extends BaseRelationShip {
	namespace = 'threads';

	values(channelId: string) {
		return fakePromise(this.cache.channels?.threads.get(channelId)).then(ids => {
			if (!ids?.length) return [];
			return this.cache.channels?.bulk(ids);
		});
	}
}
