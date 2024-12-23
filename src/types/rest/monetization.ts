import type { Snowflake } from '..';
import type { APIEntitlement, APISKU, APISubscription } from '../payloads';

/**
 * https://discord.com/developers/docs/monetization/entitlements#list-entitlements
 */
export interface RESTGetAPIEntitlementsQuery {
	/**
	 * User ID to look up entitlements for
	 */
	user_id?: Snowflake | undefined;
	/**
	 * Optional list of SKU IDs to check entitlements for
	 * Comma-delimited set of snowflakes
	 */
	sku_ids?: string | undefined;
	/**
	 * Retrieve entitlements before this entitlement ID
	 */
	before?: Snowflake | undefined;
	/**
	 * Retrieve entitlements after this entitlement ID
	 */
	after?: Snowflake | undefined;
	/**
	 * Number of entitlements to return (1-100)
	 *
	 * @default 100
	 */
	limit?: number | undefined;
	/**
	 * Guild ID to look up entitlements for
	 */
	guild_id?: Snowflake | undefined;
	/**
	 * Whether ended entitlements should be omitted. Defaults to `false`, ended entitlements are included by default
	 */
	exclude_ended?: boolean | undefined;
	/**
	 * Whether deleted entitlements should be omitted. Defaults to `true`, deleted entitlements are not included by default
	 */
	exclude_deleted?: boolean | undefined;
}

/**
 * https://discord.com/developers/docs/monetization/entitlements#list-entitlements
 */
export type RESTGetAPIEntitlementsResult = APIEntitlement[];

/**
 * https://discord.com/developers/docs/resources/entitlement#get-entitlement
 */
export type RESTGetAPIEntitlementResult = APIEntitlement;

/**
 * https://discord.com/developers/docs/monetization/entitlements#create-test-entitlement
 */
export interface RESTPostAPIEntitlementBody {
	/**
	 * ID of the SKU to grant the entitlement to
	 */
	sku_id: Snowflake;
	/**
	 * ID of the guild or user to grant the entitlement to
	 */
	owner_id: Snowflake;
	/**
	 * The type of entitlement owner
	 */
	owner_type: EntitlementOwnerType;
}

/**
 * https://discord.com/developers/docs/monetization/entitlements#create-test-entitlement
 */
export type RESTPostAPIEntitlementResult = Partial<Omit<APIEntitlement, 'ends_at' | 'starts_at'>>;

/**
 * https://discord.com/developers/docs/monetization/entitlements#create-test-entitlement
 */
export enum EntitlementOwnerType {
	Guild = 1,
	User,
}

/**
 * https://discord.com/developers/docs/monetization/entitlements#delete-test-entitlement
 */
export type RESTDeleteAPIEntitlementResult = never;

/**
 * https://discord.com/developers/docs/monetization/skus#list-skus
 */
export type RESTGetAPISKUsResult = APISKU[];

/**
 * https://discord.com/developers/docs/monetization/entitlements#consume-an-entitlement
 */
export type RESTPostAPIEntitlementConsumeResult = never;

/**
 * https://canary.discord.com/developers/docs/resources/subscription#query-string-params
 */
export interface RESTGetAPISKUSubscriptionsQuery {
	/** List subscriptions before this ID */
	before?: string;
	/** List subscriptions after this ID */
	after?: string;
	/** Number of results to return (1-100) */
	limit?: number;
	/** User ID for which to return subscriptions. Required except for OAuth queries. */
	user_id?: string;
}

/**
 * https://canary.discord.com/developers/docs/resources/subscription#list-sku-subscriptions
 */
export type RESTGetAPISKUSubscriptionsResult = APISubscription[];

/**
 * https://canary.discord.com/developers/docs/resources/subscription#get-sku-subscription
 */
export type RESTGetAPISKUSubscriptionResult = APISubscription;
