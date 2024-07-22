import type { APIEntitlement } from '../../types';
import { toCamelCase } from '../../common';
import type { UsingClient } from '../../commands';

export const ENTITLEMENT_CREATE = (_: UsingClient, data: APIEntitlement) => {
	return toCamelCase(data);
};

export const ENTITLEMENT_UPDATE = (_: UsingClient, data: APIEntitlement) => {
	return toCamelCase(data);
};

export const ENTITLEMENT_DELETE = (_: UsingClient, data: APIEntitlement) => {
	return toCamelCase(data);
};
