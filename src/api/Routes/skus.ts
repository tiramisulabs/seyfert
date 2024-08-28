import type {
	RESTGetAPISKUSubscriptionsResult,
	RESTGetAPISKUSubscriptionsQuery,
	RESTGetAPISKUSubscriptionResult,
} from '../../types';
import type { RestArguments } from '../api';
import type { ProxyRequestMethod } from '../Router';

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
