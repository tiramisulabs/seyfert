import { describe, expect, test, vi } from 'vitest';
import type { ApiHandler } from '../src/api/api';
import { Router } from '../src/api/Router';

describe('REST route proxy', () => {
	test('combines property and callable segments into one request', async () => {
		const request = vi.fn().mockResolvedValue(undefined);
		const routes = new Router({ request } as unknown as ApiHandler).createProxy();

		await routes.applications('application-id').guilds('guild-id').commands('command-id').permissions.get();

		expect(request).toHaveBeenCalledOnce();
		expect(request).toHaveBeenCalledWith(
			'GET',
			'/applications/application-id/guilds/guild-id/commands/command-id/permissions',
		);
	});
});
