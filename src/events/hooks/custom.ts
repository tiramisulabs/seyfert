import type { UsingClient } from '../../commands';
import type { ClientUser } from '../../structures';

export const BOT_READY = (_self: UsingClient, me: ClientUser) => {
	return me;
};

export const WORKER_READY = (_self: UsingClient, me: ClientUser) => {
	return me;
};
