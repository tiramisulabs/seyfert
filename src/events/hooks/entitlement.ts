import type { APIEntitlement } from '../../types';
import type { UsingClient } from '../../commands';
import { Entitlement } from '../../structures/Entitlement';
import type { GatewayEvents } from '../../websocket';

export const ENTITLEMENT_CREATE = (client: UsingClient, data: GatewayEvents['ENTITLEMENT_CREATE']) => {
	return new Entitlement(client, data);
};

export const ENTITLEMENT_UPDATE = (client: UsingClient, data: APIEntitlement) => {
	return new Entitlement(client, data);
};

export const ENTITLEMENT_DELETE = (client: UsingClient, data: APIEntitlement) => {
	return new Entitlement(client, data);
};
