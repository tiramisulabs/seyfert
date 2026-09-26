import type {
	Client,
	EntitlementStructure,
	EntitlementType,
	SKUStructure,
	SubscriptionStructure,
} from 'seyfert';
import type {
	SUBSCRIPTION_CREATE,
	SUBSCRIPTION_DELETE,
	SUBSCRIPTION_UPDATE,
} from '../lib/events/hooks/subscriptions';

declare function expectType<T>(value: T): void;
declare const client: Client;
declare const sku: SKUStructure;
declare const subscription: SubscriptionStructure;
declare const entitlement: EntitlementStructure;
declare const created: ReturnType<typeof SUBSCRIPTION_CREATE>;
declare const updated: ReturnType<typeof SUBSCRIPTION_UPDATE>;
declare const deleted: ReturnType<typeof SUBSCRIPTION_DELETE>;

expectType<string>(sku.id);
expectType<string>(sku.applicationId);
expectType<string>(sku.name);
expectType<string>(sku.slug);
expectType<boolean>(sku.isDurable);
expectType<boolean>(sku.isConsumable);
expectType<boolean>(sku.isSubscription);
expectType<boolean>(sku.isSubscriptionGroup);
expectType<boolean>(sku.isAvailable);
expectType<boolean>(sku.isGuildSubscription);
expectType<boolean>(sku.isUserSubscription);
expectType<Promise<SubscriptionStructure[]>>(sku.subscriptions());
expectType<Promise<SubscriptionStructure[]>>(sku.subscriptions({ user_id: 'user-id' }));
expectType<Promise<boolean>>(sku.hasUser('user-id'));
expectType<Promise<SKUStructure[]>>(client.monetization.listSKUs());
expectType<Promise<SKUStructure[]>>(client.applications.listSKUs());
expectType<Promise<SKUStructure>>(client.monetization.fetchSKU('sku-id'));
expectType<Promise<SubscriptionStructure[]>>(client.monetization.subscriptions('sku-id'));
expectType<Promise<SubscriptionStructure[]>>(
	client.monetization.subscriptions('sku-id', { user_id: 'user-id', limit: 50 }),
);
expectType<Promise<SubscriptionStructure>>(client.monetization.fetchSubscription('sku-id', 'subscription-id'));
expectType<SubscriptionStructure | Promise<SubscriptionStructure>>(subscription.fetch());
expectType<SubscriptionStructure | Promise<SubscriptionStructure>>(subscription.fetch('sku-id'));
expectType<boolean>(subscription.isActive);
expectType<boolean>(subscription.isInactive);
expectType<boolean>(subscription.isEnding);
expectType<Date>(subscription.currentPeriodStartAt);
expectType<Date>(subscription.currentPeriodEndAt);
expectType<Date | null>(subscription.canceledAtDate);
expectType<Promise<EntitlementStructure>>(entitlement.fetch());
expectType<Date | null>(entitlement.startsAtDate);
expectType<Date | null>(entitlement.endsAtDate);
expectType<boolean>(entitlement.isTestEntitlement);
expectType<boolean>(entitlement.isDeleted);
expectType<boolean>(entitlement.isEnded);
expectType<boolean>(entitlement.isConsumed);
expectType<Promise<EntitlementStructure>>(client.applications.fetchEntitlement('entitlement-id'));
expectType<SubscriptionStructure>(created);
expectType<SubscriptionStructure>(updated);
expectType<SubscriptionStructure>(deleted);

// @ts-expect-error Subscription queries only accept documented list params.
client.monetization.subscriptions('sku-id', { unknown_param: true });
// @ts-expect-error Fetching a subscription needs both ids.
client.monetization.fetchSubscription('sku-id');

declare const entitlementType: EntitlementType.TestModePurchase;
expectType<EntitlementType>(entitlementType);
