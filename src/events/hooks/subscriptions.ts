import { type SubscriptionStructure, Transformers } from '../../client';
import type { UsingClient } from '../../commands';
import type { APISubscription } from '../../types';

export const SUBSCRIPTION_CREATE = (client: UsingClient, data: APISubscription): SubscriptionStructure => {
	return Transformers.Subscription(client, data);
};

export const SUBSCRIPTION_UPDATE = (client: UsingClient, data: APISubscription): SubscriptionStructure => {
	return Transformers.Subscription(client, data);
};

export const SUBSCRIPTION_DELETE = (client: UsingClient, data: APISubscription): SubscriptionStructure => {
	return Transformers.Subscription(client, data);
};
