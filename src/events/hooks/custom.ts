import type { ClientUserStructure } from '../../client/transformers';
import type { UsingClient } from '../../commands';

export const BOT_READY = (_self: UsingClient, me: ClientUserStructure) => {
	return me;
};

export const WORKER_READY = (_self: UsingClient, me: ClientUserStructure) => {
	return me;
};
