import type { SubscriptionStructure } from '../client/transformers';
import type { ObjectToLower } from '../common';
import { createValidationMetadata, SeyfertError } from '../common/it/error';
import type { APISubscription } from '../types';
import { SubscriptionStatus } from '../types';
import { DiscordBase } from './extra/DiscordBase';

export interface Subscription extends DiscordBase, ObjectToLower<APISubscription> {}

/**
 * A recurring payment for at least one SKU.
 *
 * Status flips around a lot (failed payments, refunds) so Discord says not
 * to gate perks on it. Use entitlements for access and read this structure
 * for display and bookkeeping instead.
 *
 * https://docs.discord.com/developers/resources/subscription#subscription-object
 */
export class Subscription extends DiscordBase<APISubscription> {
	declare status: SubscriptionStatus;

	get isActive(): boolean {
		return this.status === SubscriptionStatus.Active;
	}

	get isInactive(): boolean {
		return this.status === SubscriptionStatus.Inactive;
	}

	get isEnding(): boolean {
		return this.status === SubscriptionStatus.Ending;
	}

	get currentPeriodStartAt(): Date {
		return new Date(this.currentPeriodStart);
	}

	get currentPeriodEndAt(): Date {
		return new Date(this.currentPeriodEnd);
	}

	get canceledAtDate(): Date | null {
		return this.canceledAt ? new Date(this.canceledAt) : null;
	}

	/**
	 * Refetches this subscription from Discord.
	 *
	 * The subscription payload does not carry its SKU, it only lists sku
	 * ids, so callers need to pass which SKU row they listed through.
	 * Defaults to the first sku id on the payload.
	 *
	 * @throws When the payload carries no sku ids and no skuId was passed.
	 *
	 * https://docs.discord.com/developers/resources/subscription#get-sku-subscription
	 */
	fetch(skuId?: string): SubscriptionStructure | Promise<SubscriptionStructure> {
		const resolved = skuId ?? this.skuIds[0];
		if (!resolved) {
			throw new SeyfertError('MISSING_SUBSCRIPTION_SKU', {
				metadata: {
					...createValidationMetadata('a subscription with at least one sku id', this.skuIds, {
						subscriptionId: this.id,
					}),
					detail: `Subscription ${this.id} has no sku ids to fetch with.`,
				},
			});
		}
		return this.client.monetization.fetchSubscription(resolved, this.id);
	}
}
