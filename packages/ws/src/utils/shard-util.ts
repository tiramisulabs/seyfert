/** unnecessary */

import type { Shard } from '../services/shard';

export async function checkOffline(
	shard: Shard,
	highPriority: boolean
): Promise<void> {
	if (!shard.isOpen()) {
		await new Promise(resolve => {
			if (highPriority) {
				shard.offlineSendQueue.unshift(resolve);
			} else {
				shard.offlineSendQueue.push(resolve);
			}
		});
	}
}
