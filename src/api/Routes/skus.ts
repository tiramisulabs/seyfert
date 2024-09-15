import type {
	RESTGetAPISKUSubscriptionResult,
	RESTGetAPISKUSubscriptionsQuery,
	RESTGetAPISKUSubscriptionsResult,
} from '../../types';
import type { ProxyRequestMethod } from '../Router';
import type { RestArguments } from '../api';

export interface SKuRoutes {
	skus(id: string): {
		get: (
			args?: RestArguments<ProxyRequestMethod.Get, RESTGetAPISKUSubscriptionsQuery>,
		) => Promise<RESTGetAPISKUSubscriptionsResult>;
		subscriptions(id: string): {
			get: (args?: RestArguments<ProxyRequestMethod.Get>) => Promise<RESTGetAPISKUSubscriptionResult>;
		};
	};
}
