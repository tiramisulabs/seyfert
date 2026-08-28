import { describe, expect, test, vi } from 'vitest';
import type { ApiHandler } from '../src/api/api';
import { Router } from '../src/api/Router';
import type { APIRoutes } from '../src/api/Routes';
import type { ApiRequestOptions, HttpMethods } from '../src/api/shared';

interface RouteCase {
	name: string;
	method: HttpMethods;
	path: `/${string}`;
	options?: ApiRequestOptions;
	invoke(routes: APIRoutes): Promise<unknown>;
}

const routeCases: RouteCase[] = [
	{
		name: 'bulk ban',
		method: 'POST',
		path: '/guilds/guild-id/bulk-ban',
		options: { body: { user_ids: ['user-id'] } },
		invoke: routes => routes.guilds('guild-id')['bulk-ban'].post({ body: { user_ids: ['user-id'] } }),
	},
	{
		name: 'get onboarding',
		method: 'GET',
		path: '/guilds/guild-id/onboarding',
		invoke: routes => routes.guilds('guild-id').onboarding.get(),
	},
	{
		name: 'modify onboarding',
		method: 'PUT',
		path: '/guilds/guild-id/onboarding',
		options: { body: {} },
		invoke: routes => routes.guilds('guild-id').onboarding.put({ body: {} }),
	},
	{
		name: 'modify incident actions',
		method: 'PUT',
		path: '/guilds/guild-id/incident-actions',
		options: { body: { dms_disabled_until: null } },
		invoke: routes =>
			routes.guilds('guild-id')['incident-actions'].put({ body: { dms_disabled_until: null } }),
	},
	{
		name: 'list voice regions',
		method: 'GET',
		path: '/voice/regions',
		invoke: routes => routes.voice.regions.get(),
	},
	{
		name: 'get current OAuth2 application',
		method: 'GET',
		path: '/oauth2/applications/@me',
		invoke: routes => routes.oauth2.applications['@me'].get(),
	},
	{
		name: 'list SKU subscriptions',
		method: 'GET',
		path: '/skus/sku-id/subscriptions',
		options: { query: { user_id: 'user-id' } },
		invoke: routes => routes.skus('sku-id').subscriptions.get({ query: { user_id: 'user-id' } }),
	},
	{
		name: 'get SKU subscription',
		method: 'GET',
		path: '/skus/sku-id/subscriptions/subscription-id',
		invoke: routes => routes.skus('sku-id').subscriptions('subscription-id').get(),
	},
	{
		name: 'get invite with query',
		method: 'GET',
		path: '/invites/invite-code',
		options: { query: { with_counts: true } },
		invoke: routes => routes.invites('invite-code').get({ query: { with_counts: true } }),
	},
	{
		name: 'modify webhook with token',
		method: 'PATCH',
		path: '/webhooks/webhook-id/webhook-token',
		options: { body: { name: 'renamed' } },
		invoke: routes => routes.webhooks('webhook-id')('webhook-token').patch({ body: { name: 'renamed' } }),
	},
	{
		name: 'edit webhook message with query',
		method: 'PATCH',
		path: '/webhooks/webhook-id/webhook-token/messages/message-id',
		options: { body: { content: 'edited' }, query: { thread_id: 'thread-id' } },
		invoke: routes =>
			routes
				.webhooks('webhook-id')('webhook-token')
				.messages('message-id')
				.patch({ body: { content: 'edited' }, query: { thread_id: 'thread-id' } }),
	},
	{
		name: 'get application command permissions',
		method: 'GET',
		path: '/applications/application-id/guilds/guild-id/commands/command-id/permissions',
		invoke: routes =>
			routes
				.applications('application-id')
				.guilds('guild-id')
				.commands('command-id')
				.permissions.get(),
	},
	{
		name: 'edit application command permissions',
		method: 'PUT',
		path: '/applications/application-id/guilds/guild-id/commands/command-id/permissions',
		options: { body: { permissions: [] } },
		invoke: routes =>
			routes
				.applications('application-id')
				.guilds('guild-id')
				.commands('command-id')
				.permissions.put({ body: { permissions: [] } }),
	},
];

describe('REST route proxy', () => {
	test.each(routeCases)('$name uses $method $path', async ({ method, path, options, invoke }) => {
		const request = vi.fn().mockResolvedValue(undefined);
		const routes = new Router({ request } as unknown as ApiHandler).createProxy();

		await invoke(routes);

		expect(request).toHaveBeenCalledOnce();
		if (options) expect(request).toHaveBeenCalledWith(method, path, options);
		else expect(request).toHaveBeenCalledWith(method, path);
	});
});
