import type { SubscriptionStructure } from '../client/transformers';
import type { ObjectToLower } from '../common';
import type { APISKU, RESTGetAPISKUSubscriptionsQuery } from '../types';
import { SKUFlags, SKUType } from '../types';
import { DiscordBase } from './extra/DiscordBase';

export interface SKU extends DiscordBase, ObjectToLower<APISKU> {}

/**
 * A premium offering for the application.
 *
 * Discord returns two rows for each subscription offering and the docs say
 * to use the one with type 5 for integration and testing, so callers that
 * list should usually filter on {@link SKU.isSubscription}.
 *
 * https://docs.discord.com/developers/resources/sku#sku-object
 */
export class SKU extends DiscordBase<APISKU> {
	declare type: SKUType;
	declare flags: SKUFlags;

	get isDurable(): boolean {
		return this.type === SKUType.Durable;
	}

	get isConsumable(): boolean {
		return this.type === SKUType.Consumable;
	}

	get isSubscription(): boolean {
		return this.type === SKUType.Subscription;
	}

	get isSubscriptionGroup(): boolean {
		return this.type === SKUType.SubscriptionGroup;
	}

	get isAvailable(): boolean {
		return (this.flags & SKUFlags.Available) !== 0;
	}

	get isGuildSubscription(): boolean {
		return (this.flags & SKUFlags.GuildSubscription) !== 0;
	}

	get isUserSubscription(): boolean {
		return (this.flags & SKUFlags.UserSubscription) !== 0;
	}

	/**
	 * Lists subscriptions containing this SKU.
	 *
	 * Discord requires user_id here except for OAuth queries, so the query
	 * stays optional and Discord rejects what it does not accept.
	 *
	 * https://docs.discord.com/developers/resources/subscription#list-sku-subscriptions
	 */
	subscriptions(query?: RESTGetAPISKUSubscriptionsQuery): Promise<SubscriptionStructure[]> {
		return this.client.monetization.subscriptions(this.id, query);
	}

	/**
	 * Checks whether a user currently holds access to this SKU.
	 *
	 * Uses entitlements for this since a subscription can stay active
	 * while Discord retries payment. Ended ones are skipped so only
	 * current access counts. Note this only sees user entitlements,
	 * guild-granted access needs a guild_id entitlement query instead.
	 */
	async hasUser(userId: string): Promise<boolean> {
		const entitlements = await this.client.applications.listEntitlements({
			user_id: userId,
			sku_ids: this.id,
			exclude_ended: true,
			limit: 1,
		});
		return entitlements.length > 0;
	}
}
