import type { UsingClient } from '../../commands';
import { toCamelCase } from '../../common';
import type { APISubscription } from '../../types';

export const SUBSCRIPTION_CREATE = (_: UsingClient, data: APISubscription) => {
	return toCamelCase(data);
};

export const SUBSCRIPTION_UPDATE = (_: UsingClient, data: APISubscription) => {
	return toCamelCase(data);
};

export const SUBSCRIPTION_DELETE = (_: UsingClient, data: APISubscription) => {
	return toCamelCase(data);
};
