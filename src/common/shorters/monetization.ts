import type { SKUStructure, SubscriptionStructure } from '../../client/transformers';
import { Transformers } from '../../client/transformers';
import type { RESTGetAPISKUSubscriptionsQuery } from '../../types';
import { createValidationMetadata, SeyfertError } from '../it/error';
import { BaseShorter } from './base';

/**
 * High level helper around the monetization endpoints.
 *
 * SKU routes live in two places: the plain list under the current
 * application and the subscription lookups under each SKU. This shorter
 * keeps that split in one spot and returns structures instead of raw
 * payloads.
 *
 * https://docs.discord.com/developers/resources/sku
 * https://docs.discord.com/developers/resources/subscription
 */
export class MonetizationShorter extends BaseShorter {
	/**
	 * Lists every SKU for the current application.
	 *
	 * Discord returns both rows for subscription offerings here, the type 6
	 * group row plus the usable type 5 row.
	 *
	 * https://docs.discord.com/developers/resources/sku#list-skus
	 */
	async listSKUs(): Promise<SKUStructure[]> {
		const skus = await this.client.proxy.applications(this.client.applicationId).skus.get();
		return skus.map(sku => Transformers.SKU(this.client, sku));
	}

	/**
	 * Fetches one SKU from the list endpoint.
	 *
	 * Discord has no get-one-SKU route, so this lists and picks the match.
	 * It throws when the id is not part of this application.
	 *
	 * https://docs.discord.com/developers/resources/sku#list-skus
	 */
	async fetchSKU(skuId: string): Promise<SKUStructure> {
		const skus = await this.listSKUs();
		const sku = skus.find(item => item.id === skuId);
		if (!sku) {
			throw new SeyfertError('UNKNOWN_SKU', {
				metadata: {
					...createValidationMetadata('a SKU id from listSKUs()', skuId, {
						applicationId: this.client.applicationId,
					}),
					detail: `SKU ${skuId} was not found for this application.`,
				},
			});
		}
		return sku;
	}

	/**
	 * Lists subscriptions containing a SKU.
	 *
	 * Discord wants a user_id query except for OAuth calls and caps limit
	 * at 1-100 with a default of 50. This checks limit early so a typo
	 * fails before the request leaves.
	 *
	 * https://docs.discord.com/developers/resources/subscription#list-sku-subscriptions
	 */
	async subscriptions(skuId: string, query?: RESTGetAPISKUSubscriptionsQuery): Promise<SubscriptionStructure[]> {
		if (query?.limit !== undefined && (!Number.isInteger(query.limit) || query.limit < 1 || query.limit > 100)) {
			throw new SeyfertError('INVALID_SKU_SUBSCRIPTION_LIMIT', {
				metadata: {
					...createValidationMetadata('an integer between 1 and 100', query.limit, { skuId }),
					detail: `Subscription limit for SKU ${skuId} must be an integer between 1 and 100.`,
				},
			});
		}
		const subscriptions = await this.client.proxy.skus(skuId).subscriptions.get({ query });
		return subscriptions.map(subscription => Transformers.Subscription(this.client, subscription));
	}

	/**
	 * Gets one subscription by id.
	 *
	 * https://docs.discord.com/developers/resources/subscription#get-sku-subscription
	 */
	async fetchSubscription(skuId: string, subscriptionId: string): Promise<SubscriptionStructure> {
		const subscription = await this.client.proxy.skus(skuId).subscriptions(subscriptionId).get();
		return Transformers.Subscription(this.client, subscription);
	}
}
