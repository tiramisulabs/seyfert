import { afterEach, describe, expect, test, vi } from 'vitest';
import { ApiHandler, type ApiRequestOptions } from '../src/api';

describe('ApiHandler request options', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	test('does not mutate retry metadata on request options', async () => {
		const fetchMock = vi.fn(async () => new Response('', { status: 200 }));
		vi.stubGlobal('fetch', fetchMock);

		const api = new ApiHandler({
			baseUrl: 'api',
			domain: 'https://discord.test',
			token: 'token',
		});
		const request = { auth: false, _50xRetries: 2 } as ApiRequestOptions & { _50xRetries?: number };

		await api.request('GET', '/users/@me', request);

		expect(request._50xRetries).toBe(2);
		expect(fetchMock).toHaveBeenCalledOnce();
	});
});
