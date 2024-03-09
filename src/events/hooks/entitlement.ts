import type { BaseClient } from '../../client/base';
import { type APIEntitlement, toCamelCase } from '../../common';

export const ENTITLEMENT_CREATE = (_: BaseClient, data: APIEntitlement) => {
	return toCamelCase(data);
};

export const ENTITLEMENT_UPDATE = (_: BaseClient, data: APIEntitlement) => {
	return toCamelCase(data);
};

export const ENTITLEMENT_DELETE = (_: BaseClient, data: APIEntitlement) => {
	return toCamelCase(data);
};
