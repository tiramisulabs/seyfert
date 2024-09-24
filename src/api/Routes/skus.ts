import type {
	RESTGetAPISKUSubscriptionResult,
	RESTGetAPISKUSubscriptionsQuery,
	RESTGetAPISKUSubscriptionsResult,
} from '../../types';
import type { RestArguments, RestArgumentsNoBody } from '../api';

export interface SKuRoutes {
	skus(id: string): {
		get: (args?: RestArguments<RESTGetAPISKUSubscriptionsQuery>) => Promise<RESTGetAPISKUSubscriptionsResult>;
		subscriptions(id: string): {
			get: (args?: RestArgumentsNoBody) => Promise<RESTGetAPISKUSubscriptionResult>;
		};
	};
}
