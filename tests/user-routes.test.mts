import { describe, expect, test, vi } from 'vitest';
import { Router } from '../src/api/Router';

describe('user routes', () => {
	test('deletes the current user application role connection', async () => {
		const request = vi.fn(async () => undefined);
		const routes = new Router({ request } as never).createProxy();

		await routes.users('@me').applications('application-id')['role-connection'].delete();

		expect(request).toHaveBeenCalledWith(
			'DELETE',
			'/users/@me/applications/application-id/role-connection',
		);
	});
});
