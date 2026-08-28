import type {
	RESTGetAPISKUSubscriptionResult,
	RESTGetAPISKUSubscriptionsQuery,
	RESTGetAPISKUSubscriptionsResult,
} from '../../types';
import type { RestArguments, RestArgumentsNoBody } from '../api';

export interface SKURoutes {
	skus(id: string): {
		/** @deprecated Use `subscriptions.get(...)` to list subscriptions. */
		get(args?: RestArguments<RESTGetAPISKUSubscriptionsQuery>): Promise<RESTGetAPISKUSubscriptionsResult>;
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

/** @deprecated Use {@link SKURoutes}. */
export interface SKuRoutes extends SKURoutes {}
