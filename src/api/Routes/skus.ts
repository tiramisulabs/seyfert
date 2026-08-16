import type {
	RESTGetAPISKUSubscriptionResult,
	RESTGetAPISKUSubscriptionsQuery,
	RESTGetAPISKUSubscriptionsResult,
} from '../../types';
import type { RestArgumentsNoBody } from '../api';

export interface SKURoutes {
	skus(id: string): {
		subscriptions: {
			get(args?: RestArgumentsNoBody<RESTGetAPISKUSubscriptionsQuery>): Promise<RESTGetAPISKUSubscriptionsResult>;
			(
				id: string,
			): {
				get(args?: RestArgumentsNoBody): Promise<RESTGetAPISKUSubscriptionResult>;
			};
		};
	};
}
