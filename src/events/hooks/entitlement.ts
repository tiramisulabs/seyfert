import { type EntitlementStructure, Transformers } from '../../client';
import type { UsingClient } from '../../commands';
import type { APIEntitlement } from '../../types';

export const ENTITLEMENT_CREATE = (client: UsingClient, data: APIEntitlement): EntitlementStructure => {
	return Transformers.Entitlement(client, data);
};

export const ENTITLEMENT_UPDATE = (client: UsingClient, data: APIEntitlement): EntitlementStructure => {
	return Transformers.Entitlement(client, data);
};

export const ENTITLEMENT_DELETE = (client: UsingClient, data: APIEntitlement): EntitlementStructure => {
	return Transformers.Entitlement(client, data);
};
