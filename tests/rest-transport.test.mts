import { afterEach, describe, expect, test, vi } from 'vitest';
import { ApiHandler } from '../src/api/api';

function createApi() {
	return new ApiHandler({
		domain: 'https://discord.example',
		token: 'handler-token',
	});
}

function jsonResponse(value: unknown, contentType = 'application/json; charset=utf-8') {
	return new Response(JSON.stringify(value), { headers: { 'content-type': contentType } });
}

afterEach(() => {
	vi.useRealTimers();
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
});

describe('Discord REST transport', () => {
	test.each([
		['false', false],
		['zero', 0],
		['null', null],
		['empty string', ''],
	])('preserves JSON %s', async (_name, value) => {
		vi.stubGlobal('fetch', vi.fn<typeof fetch>(async () => jsonResponse(value)));

		await expect(createApi().request('GET', '/users/@me')).resolves.toEqual(value);
	});

	test('decodes documented JSON, text, binary, and empty responses', async () => {
		const bytes = new Uint8Array([137, 80, 78, 71, 0, 255]);
		const fetchMock = vi
			.fn<typeof fetch>()
			.mockResolvedValueOnce(jsonResponse({ detail: 'problem' }, 'application/problem+json'))
			.mockResolvedValueOnce(new Response('id,name\n1,Seyfert', { headers: { 'content-type': 'text/csv' } }))
			.mockResolvedValueOnce(new Response(bytes, { headers: { 'content-type': 'image/png' } }))
			.mockResolvedValueOnce(new Response(null, { status: 204 }));
		vi.stubGlobal('fetch', fetchMock);
		const api = createApi();

		await expect(api.request('GET', '/responses/problem')).resolves.toEqual({ detail: 'problem' });
		await expect(api.request('GET', '/applications/1/entitlements')).resolves.toBe('id,name\n1,Seyfert');
		const binary = await api.request('GET', '/guilds/1/widget.png');
		expect([...new Uint8Array(binary as ArrayBuffer)]).toEqual([...bytes]);
		await expect(api.request('DELETE', '/channels/1/messages/2')).resolves.toBeUndefined();
	});

	test('serializes top-level arrays required by bulk command routes', async () => {
		const body = [{ name: 'ping' }] as const;
		const fetchMock = vi.fn<typeof fetch>(async () => jsonResponse({ ok: true }));
		vi.stubGlobal('fetch', fetchMock);

		await createApi().request('PUT', '/applications/1/commands', { body });

		expect(fetchMock.mock.calls[0]![1]?.body).toBe(JSON.stringify(body));
	});

	test('omits nullish query values, repeats arrays, and preserves an existing query', async () => {
		const fetchMock = vi.fn<typeof fetch>(async () => jsonResponse({ ok: true }));
		vi.stubGlobal('fetch', fetchMock);

		await createApi().request('GET', '/invites/code?existing=1', {
			query: {
				absent: null,
				enabled: false,
				tag: ['a', null, 'b'],
			},
		});

		const sent = new URL(String(fetchMock.mock.calls[0]![0]));
		expect(sent.searchParams.get('existing')).toBe('1');
		expect(sent.searchParams.getAll('tag')).toEqual(['a', 'b']);
		expect(sent.searchParams.get('enabled')).toBe('false');
		expect(sent.searchParams.has('absent')).toBe(false);
	});

	test('rejects scalar JSON errors and advances the route bucket', async () => {
		const fetchMock = vi
			.fn<typeof fetch>()
			.mockResolvedValueOnce(
				new Response('123', {
					status: 400,
					statusText: 'Bad Request',
					headers: { 'content-type': 'application/json' },
				}),
			)
			.mockResolvedValueOnce(jsonResponse({ ok: true }));
		vi.stubGlobal('fetch', fetchMock);
		const api = createApi();

		const failed = api.request('GET', '/users/@me');
		const next = api.request('GET', '/users/@me');

		await expect(failed).rejects.toMatchObject({ metadata: expect.objectContaining({ status: 400 }) });
		await expect(next).resolves.toEqual({ ok: true });
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});

	test('propagates a network failure from a 503 retry', async () => {
		vi.useFakeTimers();
		vi.spyOn(Math, 'random').mockReturnValue(0);
		const failure = new Error('retry failed');
		const fetchMock = vi
			.fn<typeof fetch>()
			.mockResolvedValueOnce(new Response('', { status: 503 }))
			.mockRejectedValueOnce(failure);
		vi.stubGlobal('fetch', fetchMock);

		const request = createApi().request('GET', '/users/@me');
		const rejection = expect(request).rejects.toBe(failure);
		await vi.advanceTimersByTimeAsync(100);

		await rejection;
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});
});
