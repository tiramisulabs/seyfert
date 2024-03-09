import type { BaseClient } from '../../client/base';
import type { ClientUser } from '../../structures';

export const BOT_READY = (_self: BaseClient, me: ClientUser) => {
	return me;
};

export const WORKER_READY = (_self: BaseClient, me: ClientUser) => {
	return me;
};
