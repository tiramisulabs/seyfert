import type { APIEntitlement } from 'discord-api-types/v10';
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
