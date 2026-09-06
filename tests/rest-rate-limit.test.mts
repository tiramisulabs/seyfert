import { afterEach, describe, expect, test, vi } from 'vitest';
import { ApiHandler } from '../src/api/api';
import { Bucket } from '../src/api/bucket';

function createApi() {
	return new ApiHandler({ token: 'bot-token', domain: 'https://discord.example' });
}

afterEach(() => {
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
	vi.useRealTimers();
});

describe('Discord REST rate limits', () => {
	test('waits for X-RateLimit-Reset when relative reset headers are absent', async () => {
		vi.useFakeTimers();
		const now = 1_700_000_000_000;
		vi.setSystemTime(now);
		const fetchMock = vi.fn<typeof fetch>(
			async () =>
				new Response('{}', {
					headers: {
						'content-type': 'application/json',
						'x-ratelimit-limit': '1',
						'x-ratelimit-remaining': '0',
						'x-ratelimit-reset': String((now + 1_000) / 1_000),
					},
				}),
		);
		vi.stubGlobal('fetch', fetchMock);
		const api = createApi();
		const route = '/channels/100000000000000001/messages' as const;

		await api.request('GET', route);
		const queued = api.request('GET', route);
		expect(fetchMock).toHaveBeenCalledTimes(1);

		await vi.advanceTimersByTimeAsync(1_001);

		await expect(queued).resolves.toEqual({});
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});

	test('separates provisional buckets by HTTP method', async () => {
		const fetchMock = vi
			.fn<typeof fetch>()
			.mockResolvedValueOnce(
				new Response('{}', {
					headers: {
						'content-type': 'application/json',
						'x-ratelimit-limit': '1',
						'x-ratelimit-remaining': '0',
						'x-ratelimit-reset-after': '1',
					},
				}),
			)
			.mockResolvedValueOnce(new Response('{}', { headers: { 'content-type': 'application/json' } }));
		vi.stubGlobal('fetch', fetchMock);
		const api = createApi();
		const route = '/channels/100000000000000001/messages' as const;

		await api.request('POST', route, { body: { content: 'hello' } });
		await expect(api.request('GET', route)).resolves.toEqual({});
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});

	test('learns shared bucket hashes while retaining channel major parameters', async () => {
		vi.useFakeTimers();
		const headers = {
			'content-type': 'application/json',
			'x-ratelimit-bucket': 'shared-hash',
			'x-ratelimit-limit': '1',
			'x-ratelimit-remaining': '0',
			'x-ratelimit-reset-after': '0.05',
		};
		const fetchMock = vi
			.fn<typeof fetch>()
			.mockResolvedValueOnce(new Response('{}', { headers }))
			.mockResolvedValueOnce(new Response('{}', { headers }))
			.mockResolvedValueOnce(new Response('{}', { headers: { 'content-type': 'application/json' } }));
		vi.stubGlobal('fetch', fetchMock);
		const api = createApi();
		const channel = '100000000000000001';

		await api.request('GET', `/channels/${channel}/messages`);
		await api.request('GET', `/channels/${channel}/pins`);
		const queued = api.request('GET', `/channels/${channel}/pins`);
		expect(fetchMock).toHaveBeenCalledTimes(2);

		await vi.advanceTimersByTimeAsync(51);

		await expect(queued).resolves.toEqual({});
		expect(fetchMock).toHaveBeenCalledTimes(3);
		expect(api.ratelimits.has(`shared-hash:channels:${channel}`)).toBe(true);
	});

	test('does not share a learned bucket across different channel majors', async () => {
		const headers = {
			'content-type': 'application/json',
			'x-ratelimit-bucket': 'shared-hash',
			'x-ratelimit-limit': '1',
			'x-ratelimit-remaining': '0',
			'x-ratelimit-reset-after': '1',
		};
		const fetchMock = vi.fn<typeof fetch>(async () => new Response('{}', { headers }));
		vi.stubGlobal('fetch', fetchMock);
		const api = createApi();

		await api.request('GET', '/channels/100000000000000001/messages');
		await api.request('GET', '/channels/200000000000000002/messages');

		expect(fetchMock).toHaveBeenCalledTimes(2);
		expect(api.ratelimits.has('shared-hash:channels:100000000000000001')).toBe(true);
		expect(api.ratelimits.has('shared-hash:channels:200000000000000002')).toBe(true);
	});

	test.each([
		['guild', '/guilds/100000000000000001/members', 'shared-hash:guilds:100000000000000001'],
		[
			'webhook',
			'/webhooks/100000000000000001/webhook-token/messages/@original',
			'shared-hash:webhooks:100000000000000001:webhook-token',
		],
	])('retains the %s major parameter in learned buckets', async (_name, url, bucket) => {
		vi.stubGlobal(
			'fetch',
			vi.fn<typeof fetch>(
				async () =>
					new Response('{}', {
						headers: {
							'content-type': 'application/json',
							'x-ratelimit-bucket': 'shared-hash',
						},
					}),
			),
		);
		const api = createApi();

		await api.request('GET', url as `/${string}`, { auth: false });

		expect(api.ratelimits.has(bucket)).toBe(true);
	});

	test('uses Retry-After when a 429 body is not JSON', async () => {
		vi.useFakeTimers();
		const fetchMock = vi
			.fn<typeof fetch>()
			.mockResolvedValueOnce(
				new Response('<html>rate limited</html>', {
					status: 429,
					headers: { 'retry-after': '0.002' },
				}),
			)
			.mockResolvedValueOnce(new Response('{}', { headers: { 'content-type': 'application/json' } }));
		vi.stubGlobal('fetch', fetchMock);
		const request = createApi().request('GET', '/channels/100000000000000001/messages');

		await vi.advanceTimersByTimeAsync(2);

		await expect(request).resolves.toEqual({});
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});

	test('keeps a 429 retry ahead of later requests in the same bucket', async () => {
		const bodies: string[] = [];
		vi.stubGlobal(
			'fetch',
			vi.fn<typeof fetch>(async (_input, init) => {
				bodies.push(JSON.parse(String(init?.body)).content);
				return bodies.length === 1
					? new Response('{"retry_after":0}', { status: 429, headers: { 'content-type': 'application/json' } })
					: new Response('{}', { headers: { 'content-type': 'application/json' } });
			}),
		);
		const api = createApi();
		const url = '/channels/100000000000000001/messages' as const;

		await Promise.all([
			api.request('POST', url, { body: { content: 'first' } }),
			api.request('POST', url, { body: { content: 'second' } }),
		]);

		expect(bodies).toEqual(['first', 'first', 'second']);
	});

	test('propagates a failed 429 retry to the original caller', async () => {
		const fetchMock = vi
			.fn<typeof fetch>()
			.mockResolvedValueOnce(
				new Response('{"retry_after":0}', {
					status: 429,
					headers: { 'content-type': 'application/json' },
				}),
			)
			.mockResolvedValueOnce(
				new Response('{"code":50035,"message":"retry failed"}', {
					status: 400,
					statusText: 'Bad Request',
					headers: { 'content-type': 'application/json' },
				}),
			);
		vi.stubGlobal('fetch', fetchMock);

		await expect(createApi().request('GET', '/channels/100000000000000001/messages')).rejects.toMatchObject({
			metadata: expect.objectContaining({ status: 400 }),
		});
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});

	test('scopes a global 429 gate to the authentication identity', async () => {
		vi.useFakeTimers();
		let channelAttempts = 0;
		const paths: string[] = [];
		const fetchMock = vi.fn<typeof fetch>(async input => {
			const path = new URL(String(input)).pathname;
			paths.push(path);
			if (path.endsWith('/channels/100000000000000001/messages') && channelAttempts++ === 0) {
				return new Response('{"global":true,"retry_after":0.05}', {
					status: 429,
					headers: {
						'content-type': 'application/json',
						'x-ratelimit-global': 'true',
						'x-ratelimit-scope': 'global',
					},
				});
			}
			return new Response('{}', { headers: { 'content-type': 'application/json' } });
		});
		vi.stubGlobal('fetch', fetchMock);
		const api = createApi();
		const limited = api.request('GET', '/channels/100000000000000001/messages');
		await vi.advanceTimersByTimeAsync(0);
		expect(api.globalBlock).toBe(true);

		const unauthenticated = api.request('GET', '/invites/code', { auth: false });
		const otherBot = api.request('GET', '/gateway/bot', { token: 'other-bot-token' });
		const sameBot = api.request('GET', '/users/@me');
		const interaction = api.request('POST', '/interactions/1/token/callback', {
			auth: false,
			body: { type: 1 },
		});
		await vi.advanceTimersByTimeAsync(0);
		expect(paths.some(path => path.endsWith('/interactions/1/token/callback'))).toBe(true);
		expect(paths.some(path => path.endsWith('/invites/code'))).toBe(true);
		expect(paths.some(path => path.endsWith('/gateway/bot'))).toBe(true);
		expect(fetchMock).toHaveBeenCalledTimes(4);
		expect(paths.some(path => path.endsWith('/users/@me'))).toBe(false);

		await vi.advanceTimersByTimeAsync(50);

		await expect(Promise.all([limited, unauthenticated, otherBot, sameBot, interaction])).resolves.toEqual([
			{},
			{},
			{},
			{},
			{},
		]);
		expect(paths.some(path => path.endsWith('/users/@me'))).toBe(true);
		expect(api.globalBlock).toBe(false);
	});

	test('starts a global gate before awaiting rate-limit observers', async () => {
		vi.useFakeTimers();
		let releaseObserver: (() => void) | undefined;
		let attempts = 0;
		const fetchMock = vi.fn<typeof fetch>(async () => {
			if (attempts++ === 0) {
				return new Response('{"global":true,"retry_after":0.05}', {
					status: 429,
					headers: { 'content-type': 'application/json', 'x-ratelimit-global': 'true' },
				});
			}
			return new Response('{}', { headers: { 'content-type': 'application/json' } });
		});
		vi.stubGlobal('fetch', fetchMock);
		const api = createApi();
		api.observe({
			onRatelimit: () =>
				new Promise<void>(resolve => {
					releaseObserver = resolve;
				}),
		});

		const limited = api.request('GET', '/channels/100000000000000001/messages');
		await vi.advanceTimersByTimeAsync(0);
		expect(api.globalBlock).toBe(true);

		const queued = api.request('GET', '/users/@me');
		await vi.advanceTimersByTimeAsync(0);
		expect(fetchMock).toHaveBeenCalledTimes(1);

		releaseObserver?.();
		await vi.advanceTimersByTimeAsync(50);

		await expect(Promise.all([limited, queued])).resolves.toEqual([{}, {}]);
		expect(fetchMock).toHaveBeenCalledTimes(3);
	});

	test('parks an exhausted smart bucket without polling', () => {
		vi.useFakeTimers();
		const now = 1_700_000_000_000;
		vi.setSystemTime(now);
		const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout');
		const bucket = new Bucket(1);
		const dispatch = vi.fn((next: () => void) => next());
		bucket.remaining = 0;
		bucket.reset = now + 100;
		bucket.resetAfter = 100;

		bucket.triggerResetAfter();
		bucket.push({ next: dispatch, resolve: vi.fn(), reject: vi.fn() });

		expect(setTimeoutSpy).toHaveBeenCalledTimes(2);
		vi.advanceTimersByTime(100);
		expect(dispatch).not.toHaveBeenCalled();
		expect(setTimeoutSpy).toHaveBeenCalledTimes(2);

		vi.advanceTimersByTime(1);
		expect(dispatch).toHaveBeenCalledOnce();
		expect(setTimeoutSpy).toHaveBeenCalledTimes(2);
	});

	test('wakes a parked smart bucket when its refill arrives first', () => {
		vi.useFakeTimers();
		const now = 1_700_000_000_000;
		vi.setSystemTime(now);
		const bucket = new Bucket(1);
		const dispatch = vi.fn((next: () => void) => next());
		bucket.remaining = 0;
		bucket.reset = now + 1_000;
		bucket.resetAfter = 100;

		bucket.triggerResetAfter();
		bucket.push({ next: dispatch, resolve: vi.fn(), reject: vi.fn() });

		vi.advanceTimersByTime(149);
		expect(dispatch).not.toHaveBeenCalled();

		vi.advanceTimersByTime(1);
		expect(dispatch).toHaveBeenCalledOnce();
		expect(vi.getTimerCount()).toBe(0);
	});

	test('does not dispatch a smart refill during an active callback', () => {
		vi.useFakeTimers();
		const now = 1_700_000_000_000;
		vi.setSystemTime(now);
		const bucket = new Bucket(1);
		let release: (() => void) | undefined;
		const firstDispatch = vi.fn((next: () => void) => {
			release = next;
		});
		const queuedDispatch = vi.fn((next: () => void) => next());

		bucket.push({ next: firstDispatch, resolve: vi.fn(), reject: vi.fn() });
		bucket.remaining = 0;
		bucket.reset = now + 1_000;
		bucket.resetAfter = 100;
		bucket.triggerResetAfter();
		bucket.push({ next: queuedDispatch, resolve: vi.fn(), reject: vi.fn() });

		vi.advanceTimersByTime(150);
		expect(queuedDispatch).not.toHaveBeenCalled();

		release?.();
		expect(queuedDispatch).toHaveBeenCalledOnce();
	});

	test.each([
		'not-a-number',
		String(Number.MAX_VALUE),
	])('rejects a 429 without a valid retry delay (%s) and releases the bucket', async retryAfter => {
		const api = createApi();
		const route = 'GET:/channels/100000000000000001/messages';
		const url = '/channels/100000000000000001/messages' as const;
		const next = vi.fn();
		const reject = vi.fn();
		api.ratelimits.set(route, new Bucket(1));

		const result = await api.handle429(
			route,
			'GET',
			url,
			{},
			new Response('<html>rate limited</html>', {
				status: 429,
				headers: { 'retry-after': retryAfter },
			}),
			'<html>rate limited</html>',
			next,
			reject,
			Date.now(),
			url,
		);

		expect(result).toBe(false);
		expect(next).toHaveBeenCalledOnce();
		expect(reject).toHaveBeenCalledWith(expect.objectContaining({ code: 'INVALID_RETRY_AFTER' }));
	});

	test('rejects an empty 429 response without a retry delay', async () => {
		const api = createApi();
		const route = 'GET:/channels/100000000000000001/messages';
		const url = '/channels/100000000000000001/messages' as const;
		const next = vi.fn();
		const reject = vi.fn();
		api.ratelimits.set(route, new Bucket(1));

		const result = await api.handle429(
			route,
			'GET',
			url,
			{},
			new Response('', { status: 429 }),
			'',
			next,
			reject,
			Date.now(),
			url,
		);

		expect(result).toBe(false);
		expect(next).toHaveBeenCalledOnce();
		expect(reject).toHaveBeenCalledWith(expect.objectContaining({ code: 'INVALID_RETRY_AFTER' }));
	});

	test('keeps queued requests throttled when bucket counts are malformed', async () => {
		vi.useFakeTimers();
		vi.setSystemTime(1_700_000_000_000);
		const fetchMock = vi
			.fn<typeof fetch>()
			.mockResolvedValueOnce(
				new Response('{}', {
					headers: {
						'content-type': 'application/json',
						'x-ratelimit-limit': 'not-a-number',
						'x-ratelimit-remaining': 'not-a-number',
						'x-ratelimit-reset-after': '0.05',
					},
				}),
			)
			.mockResolvedValue(new Response('{}', { headers: { 'content-type': 'application/json' } }));
		vi.stubGlobal('fetch', fetchMock);
		const api = createApi();
		const route = '/channels/100000000000000001/messages' as const;

		const first = api.request('GET', route);
		const queued = api.request('GET', route);
		await first;
		expect(fetchMock).toHaveBeenCalledTimes(1);

		await vi.advanceTimersByTimeAsync(50);
		expect(fetchMock).toHaveBeenCalledTimes(1);

		await vi.advanceTimersByTimeAsync(1);
		await expect(queued).resolves.toEqual({});
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});

	test.each([
		['2', 'not-a-number', 2, 2],
		['1.5', '0', 10, 0],
		['2', '', 2, 2],
		[String(Number.MAX_SAFE_INTEGER + 1), '0', 10, 0],
	])('applies the valid rate-limit counts from (%s, %s)', (limit, remaining, expectedLimit, expectedRemaining) => {
		const api = createApi();
		const route = 'GET:/channels/100000000000000001/messages';
		const bucket = new Bucket(10);
		bucket.remaining = 8;
		api.ratelimits.set(route, bucket);

		api.setRatelimitsBucket(
			route,
			new Response('{}', {
				headers: {
					'x-ratelimit-limit': limit,
					'x-ratelimit-remaining': remaining,
				},
			}),
		);

		expect(bucket.limit).toBe(expectedLimit);
		expect(bucket.remaining).toBe(expectedRemaining);
	});

	test('honors an exhausted remaining count when its limit is malformed', () => {
		vi.useFakeTimers();
		const now = 1_700_000_000_000;
		vi.setSystemTime(now);
		const api = createApi();
		const route = 'GET:/channels/100000000000000001/messages';
		const bucket = new Bucket(10);
		const dispatch = vi.fn((next: () => void) => next());
		bucket.remaining = 8;
		bucket.reset = now + 100;
		api.ratelimits.set(route, bucket);

		api.setRatelimitsBucket(
			route,
			new Response('{}', {
				headers: {
					'x-ratelimit-limit': 'not-a-number',
					'x-ratelimit-remaining': '0',
				},
			}),
		);
		bucket.push({ next: dispatch, resolve: vi.fn(), reject: vi.fn() });

		expect(dispatch).not.toHaveBeenCalled();
		vi.advanceTimersByTime(100);
		expect(dispatch).not.toHaveBeenCalled();
		vi.advanceTimersByTime(1);
		expect(dispatch).toHaveBeenCalledOnce();
	});

	test('caps a remaining count above the advertised limit', () => {
		const api = createApi();
		const route = 'GET:/channels/100000000000000001/messages';
		const bucket = new Bucket(1);
		api.ratelimits.set(route, bucket);

		api.setRatelimitsBucket(
			route,
			new Response('{}', {
				headers: {
					'x-ratelimit-limit': '2',
					'x-ratelimit-remaining': '99',
				},
			}),
		);

		expect(bucket.limit).toBe(2);
		expect(bucket.remaining).toBe(2);
	});

	test('ignores smart-bucket reset durations that overflow the timer range', () => {
		const api = new ApiHandler({ token: 'bot-token', domain: 'https://discord.example', smartBucket: true });
		const route = 'GET:/channels/100000000000000001/messages';
		const bucket = new Bucket(1);
		bucket.remaining = 0;
		api.ratelimits.set(route, bucket);

		api.setRatelimitsBucket(
			route,
			new Response('{}', {
				headers: {
					'x-ratelimit-limit': '1',
					'x-ratelimit-remaining': '0',
					'x-ratelimit-reset-after': String(Number.MAX_VALUE),
				},
			}),
		);

		expect(bucket.resetAfter).toBe(0);
	});

	test('preserves malformed absolute resets and caps oversized timestamps', () => {
		const api = createApi();
		const route = 'GET:/channels/100000000000000001/messages';
		const now = 1_700_000_000_000;
		const bucket = new Bucket(1);
		bucket.reset = now + 100;
		api.ratelimits.set(route, bucket);

		api.setResetBucket(
			route,
			new Response('{}', { headers: { 'x-ratelimit-reset': 'not-a-number' } }),
			now,
			Number.NaN,
		);
		expect(bucket.reset).toBe(now + 100);

		api.setResetBucket(
			route,
			new Response('{}', { headers: { 'x-ratelimit-reset': String(Number.MAX_SAFE_INTEGER) } }),
			now,
			Number.NaN,
		);
		expect(bucket.reset).toBe(now + 2_147_483_646);
	});
});
