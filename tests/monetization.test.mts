import { createMockBot, mockWorld } from '@slipher/testing';
import { describe, expect, test } from 'vitest';
import { Entitlement, SKU, Subscription } from '../lib';
import { SUBSCRIPTION_CREATE, SUBSCRIPTION_DELETE, SUBSCRIPTION_UPDATE } from '../lib/events/hooks/subscriptions';

const skuPayload = {
	id: '1088510058284990888',
	type: 5,
	application_id: '788708323867885999',
	name: 'Test Premium',
	slug: 'test-premium',
	flags: 128,
	dependent_sku_id: null,
	access_type: 1,
	manifest_labels: null,
	features: [],
	release_date: null,
	premium: false,
	show_age_gate: false,
};

const subscriptionPayload = {
	id: '1278078770116427839',
	user_id: '1088605110638227537',
	sku_ids: ['1158857122189168803'],
	entitlement_ids: [],
	renewal_sku_ids: null,
	current_period_start: '2024-08-27T19:48:44.406602+00:00',
	current_period_end: '2024-09-27T19:48:44.406602+00:00',
	status: 0,
	canceled_at: null,
};

const entitlementPayload = {
	id: '1019653849998299136',
	sku_id: '1019475255913222144',
	application_id: '1019370614521200640',
	user_id: '771129655544643584',
	type: 8,
	deleted: false,
	starts_at: '2022-09-14T17:00:18.704163+00:00',
	ends_at: '2022-10-14T17:00:18.704163+00:00',
	guild_id: '1015034326372454400',
	promotion_id: null,
	gift_code_flags: 0,
	subscription_id: '1019653835926409216',
	consumed: false,
};

describe('Monetization', () => {
	test('lists SKUs as structures and exposes flag helpers', async () => {
		const world = mockWorld();
		await using bot = await createMockBot({ world });
		const route = `/applications/${bot.client.applicationId}/skus`;
		bot.rest.intercept('GET', route, () => [{ ...skuPayload, id: '1088510053843210999', type: 6 }, skuPayload]);
		const skus = await bot.client.monetization.listSKUs();
		expect(skus).toHaveLength(2);
		expect(skus[1]).toBeInstanceOf(SKU);
		expect(skus[1]).toMatchObject({ id: skuPayload.id, name: 'Test Premium', slug: 'test-premium' });
		expect(skus[1]!.isSubscription).toBe(true);
		expect(skus[1]!.isSubscriptionGroup).toBe(false);
		expect(skus[0]!.isSubscriptionGroup).toBe(true);
		expect(skus[1]!.isUserSubscription).toBe(false);
		expect(skus[1]!.isAvailable).toBe(false);
	});
	test('fetchSKU picks the match and rejects unknown ids', async () => {
		const world = mockWorld();
		await using bot = await createMockBot({ world });
		const route = `/applications/${bot.client.applicationId}/skus`;
		bot.rest.intercept('GET', route, () => [skuPayload]);
		const sku = await bot.client.monetization.fetchSKU(skuPayload.id);
		expect(sku).toBeInstanceOf(SKU);
		expect(sku.isSubscription).toBe(true);
		const before = bot.restCalls().length;
		await expect(bot.client.monetization.fetchSKU('1')).rejects.toMatchObject({ code: 'UNKNOWN_SKU' });
		expect(bot.restCalls().length).toBeGreaterThan(before);
	});
	test('application listSKUs returns the same structures', async () => {
		const world = mockWorld();
		await using bot = await createMockBot({ world });
		bot.rest.intercept('GET', `/applications/${bot.client.applicationId}/skus`, () => [skuPayload]);
		const skus = await bot.client.applications.listSKUs();
		expect(skus[0]).toBeInstanceOf(SKU);
	});
	test('subscription listing validates limit and returns structures', async () => {
		const world = mockWorld();
		await using bot = await createMockBot({ world });
		const route = `/skus/${skuPayload.id}/subscriptions`;
		bot.rest.intercept('GET', route, request => {
			expect(request.query).toMatchObject({ user_id: '1088605110638227537', limit: 50 });
			return [{ ...subscriptionPayload, sku_ids: [skuPayload.id] }];
		});
		const subscriptions = await bot.client.monetization.subscriptions(skuPayload.id, {
			user_id: '1088605110638227537',
			limit: 50,
		});
		expect(subscriptions[0]).toBeInstanceOf(Subscription);
		expect(subscriptions[0]!.isActive).toBe(true);
		expect(subscriptions[0]!.isEnding).toBe(false);
		expect(subscriptions[0]!.currentPeriodStartAt).toBeInstanceOf(Date);
		expect(subscriptions[0]!.canceledAtDate).toBeNull();
		const before = bot.restCalls().length;
		await expect(bot.client.monetization.subscriptions(skuPayload.id, { limit: 0 })).rejects.toMatchObject({
			code: 'INVALID_SKU_SUBSCRIPTION_LIMIT',
		});
		await expect(bot.client.monetization.subscriptions(skuPayload.id, { limit: 101 })).rejects.toMatchObject({
			code: 'INVALID_SKU_SUBSCRIPTION_LIMIT',
		});
		expect(bot.restCalls().length).toBe(before);
	});
	test('fetchSubscription and structure fetch hit the single route', async () => {
		const world = mockWorld();
		await using bot = await createMockBot({ world });
		const route = `/skus/${skuPayload.id}/subscriptions/${subscriptionPayload.id}`;
		bot.rest.intercept('GET', route, () => ({ ...subscriptionPayload, sku_ids: [skuPayload.id] }));
		const fetched = await bot.client.monetization.fetchSubscription(skuPayload.id, subscriptionPayload.id);
		expect(fetched).toBeInstanceOf(Subscription);
		expect(fetched.currentPeriodEndAt.toISOString()).toBe('2024-09-27T19:48:44.406Z');
		const again = await fetched.fetch(skuPayload.id);
		expect(again.id).toBe(subscriptionPayload.id);
	});
	test('SKU helpers delegate listing and access checks', async () => {
		const world = mockWorld();
		await using bot = await createMockBot({ world });
		bot.rest.intercept('GET', `/skus/${skuPayload.id}/subscriptions`, () => [
			{ ...subscriptionPayload, sku_ids: [skuPayload.id] },
		]);
		bot.rest.intercept('GET', `/applications/${bot.client.applicationId}/skus`, () => [skuPayload]);
		const sku = await bot.client.monetization.fetchSKU(skuPayload.id);
		const subscriptions = await sku.subscriptions({ user_id: subscriptionPayload.user_id });
		expect(subscriptions[0]).toBeInstanceOf(Subscription);
		expect(await sku.hasUser(subscriptionPayload.user_id)).toBe(true);
		bot.rest.intercept('GET', `/skus/${skuPayload.id}/subscriptions`, () => []);
		bot.rest.intercept('GET', `/applications/${bot.client.applicationId}/entitlements`, () => []);
		expect(await sku.hasUser('2')).toBe(false);
		bot.rest.intercept('GET', `/skus/${skuPayload.id}/subscriptions`, () => [
			{ ...subscriptionPayload, sku_ids: [skuPayload.id], status: 1 },
		]);
		bot.rest.intercept('GET', `/applications/${bot.client.applicationId}/entitlements`, () => []);
		expect(await sku.hasUser('3')).toBe(false);
	});
	test('entitlement fetch keeps extra payload fields', async () => {
		const world = mockWorld();
		await using bot = await createMockBot({ world });
		const route = `/applications/${bot.client.applicationId}/entitlements/${entitlementPayload.id}`;
		bot.rest.intercept('GET', route, () => entitlementPayload);
		const entitlement = await bot.client.applications.fetchEntitlement(entitlementPayload.id);
		expect(entitlement).toBeInstanceOf(Entitlement);
		expect(entitlement).toMatchObject({
			id: entitlementPayload.id,
			subscriptionId: entitlementPayload.subscription_id,
			promotionId: null,
			giftCodeFlags: 0,
		});
		expect(entitlement.startsAtDate?.toISOString()).toBe('2022-09-14T17:00:18.704Z');
		expect(entitlement.isDeleted).toBe(false);
		expect(entitlement.isConsumed).toBe(false);
		const refetched = await entitlement.fetch();
		expect(refetched.id).toBe(entitlementPayload.id);
	});
	test('gateway subscription hooks return structures', () => {
		const fakeClient = {} as never;
		const created = SUBSCRIPTION_CREATE(fakeClient, subscriptionPayload as never);
		const updated = SUBSCRIPTION_UPDATE(fakeClient, subscriptionPayload as never);
		const deleted = SUBSCRIPTION_DELETE(fakeClient, { ...subscriptionPayload, status: 1 } as never);
		expect(created).toBeInstanceOf(Subscription);
		expect(updated).toBeInstanceOf(Subscription);
		expect(deleted.isInactive).toBe(true);
	});
	test('subscription fetch without sku ids throws before REST', async () => {
		const world = mockWorld();
		await using bot = await createMockBot({ world });
		const empty = { ...subscriptionPayload, sku_ids: [] as string[] };
		bot.rest.intercept('GET', `/skus/${skuPayload.id}/subscriptions/${subscriptionPayload.id}`, () => empty);
		const fetched = await bot.client.monetization.fetchSubscription(skuPayload.id, subscriptionPayload.id);
		const before = bot.restCalls().length;
		try {
			await fetched.fetch();
			expect.unreachable();
		} catch (error) {
			expect(error).toMatchObject({ code: 'MISSING_SUBSCRIPTION_SKU' });
		}
		expect(bot.restCalls().length).toBe(before);
	});
});
