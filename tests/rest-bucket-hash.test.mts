import { afterEach, describe, expect, test, vi } from 'vitest';
import { ApiHandler } from '../src/api/api';

const channelId = '100000000000000001';
const otherChannelId = '100000000000000002';
const messageId = '200000000000000001';

function createResponse(hash: string) {
	return new Response(JSON.stringify({ ok: true }), {
		status: 200,
		headers: {
			'content-type': 'application/json',
			'x-ratelimit-bucket': hash,
			'x-ratelimit-limit': '5',
			'x-ratelimit-remaining': '4',
			'x-ratelimit-reset-after': '1',
		},
	});
}

function createApi(fetchMock: ReturnType<typeof vi.fn>) {
	vi.stubGlobal('fetch', fetchMock);
	return new ApiHandler({ token: 'default-token' });
}

function block(bucket: NonNullable<ReturnType<ApiHandler['ratelimits']['get']>>) {
	bucket.remaining = 0;
	bucket.reset = Date.now() + 1_000;
}

afterEach(() => {
	vi.useRealTimers();
	vi.unstubAllGlobals();
});

describe('REST bucket hashes', () => {
	test('groups routes with the same hash and major parameter after both routes are learned', async () => {
		vi.useFakeTimers();
		vi.setSystemTime(1_000);
		const fetchMock = vi.fn(async () => createResponse('shared-hash'));
		const api = createApi(fetchMock);
		const messages = `/channels/${channelId}/messages` as const;
		const message = `/channels/${channelId}/messages/${messageId}` as const;

		await api.request('GET', messages);
		await api.request('GET', message);

		const canonicalBucket = api.ratelimits.get(api.routefy(messages, 'GET'))!;
		expect(api.ratelimits.get(api.routefy(message, 'GET'))).toBe(canonicalBucket);
		block(canonicalBucket);

		const queued = api.request('GET', message);
		await Promise.resolve();
		expect(fetchMock).toHaveBeenCalledTimes(2);

		await vi.advanceTimersByTimeAsync(1_001);
		await expect(queued).resolves.toEqual({ ok: true });
		expect(fetchMock).toHaveBeenCalledTimes(3);
	});

	test('lets an existing provisional queue drain instead of migrating it', async () => {
		vi.useFakeTimers();
		vi.setSystemTime(1_000);
		let resolveSecondFetch!: (response: Response) => void;
		const secondFetch = new Promise<Response>(resolve => {
			resolveSecondFetch = resolve;
		});
		const fetchMock = vi
			.fn<(...args: Parameters<typeof fetch>) => Promise<Response>>()
			.mockResolvedValueOnce(createResponse('shared-hash'))
			.mockReturnValueOnce(secondFetch)
			.mockImplementation(async () => createResponse('shared-hash'));
		const api = createApi(fetchMock);
		const messages = `/channels/${channelId}/messages` as const;
		const message = `/channels/${channelId}/messages/${messageId}` as const;

		await api.request('GET', messages);
		block(api.ratelimits.get(api.routefy(messages, 'GET'))!);

		const firstProvisional = api.request('GET', message);
		const queuedProvisional = api.request('GET', message);
		await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));

		resolveSecondFetch(createResponse('shared-hash'));
		await expect(firstProvisional).resolves.toEqual({ ok: true });
		await expect(queuedProvisional).resolves.toEqual({ ok: true });
		expect(fetchMock).toHaveBeenCalledTimes(3);

		const canonical = api.request('GET', message);
		await Promise.resolve();
		expect(fetchMock).toHaveBeenCalledTimes(3);

		await vi.advanceTimersByTimeAsync(1_001);
		await expect(canonical).resolves.toEqual({ ok: true });
		expect(fetchMock).toHaveBeenCalledTimes(4);
	});

	test('resolves the current bucket after waiting for a global unblock', async () => {
		vi.useFakeTimers();
		vi.setSystemTime(1_000);
		let resolveFirstFetch!: (response: Response) => void;
		const firstFetch = new Promise<Response>(resolve => {
			resolveFirstFetch = resolve;
		});
		const fetchMock = vi
			.fn<(...args: Parameters<typeof fetch>) => Promise<Response>>()
			.mockReturnValueOnce(firstFetch)
			.mockImplementation(async () => createResponse('shared-hash'));
		const api = createApi(fetchMock);
		const route = `/channels/${channelId}/messages` as const;

		const learningRequest = api.request('GET', route);
		await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
		api.globalBlock = true;
		const globallyQueued = api.request('GET', route);

		resolveFirstFetch(createResponse('shared-hash'));
		await expect(learningRequest).resolves.toEqual({ ok: true });
		block(api.ratelimits.get(api.routefy(route, 'GET'))!);
		api.globalUnblock();
		await Promise.resolve();
		expect(fetchMock).toHaveBeenCalledTimes(1);

		await vi.advanceTimersByTimeAsync(1_001);
		await expect(globallyQueued).resolves.toEqual({ ok: true });
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});

	test('keeps identical bucket hashes isolated by major parameter', async () => {
		const fetchMock = vi.fn(async () => createResponse('shared-hash'));
		const api = createApi(fetchMock);
		const firstChannel = `/channels/${channelId}/messages` as const;
		const secondChannel = `/channels/${otherChannelId}/messages` as const;

		await api.request('GET', firstChannel);
		block(api.ratelimits.get(api.routefy(firstChannel, 'GET'))!);

		await expect(api.request('GET', secondChannel)).resolves.toEqual({ ok: true });
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});

	test('learns bucket hashes independently for each HTTP method', async () => {
		const fetchMock = vi.fn(async (_url: string, init: RequestInit) =>
			createResponse(init.method === 'GET' ? 'get-hash' : 'post-hash'),
		);
		const api = createApi(fetchMock);
		const route = `/channels/${channelId}/messages` as const;

		await api.request('GET', route);
		block(api.ratelimits.get(api.routefy(route, 'GET'))!);

		await expect(api.request('POST', route, { body: { content: 'hello' } })).resolves.toEqual({ ok: true });
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});

	test('keeps default, custom-token, and unauthenticated buckets isolated', async () => {
		const fetchMock = vi.fn(async () => createResponse('shared-hash'));
		const api = createApi(fetchMock);
		const route = `/channels/${channelId}/messages` as const;
		const customToken = 'other-token';

		await api.request('GET', route);
		block(api.ratelimits.get(api.routefy(route, 'GET'))!);

		await expect(api.request('GET', route, { token: customToken })).resolves.toEqual({ ok: true });
		await expect(api.request('GET', route, { auth: false })).resolves.toEqual({ ok: true });
		expect(fetchMock).toHaveBeenCalledTimes(3);
		for (const key of api.ratelimits.keys()) {
			expect(key).not.toContain('default-token');
			expect(key).not.toContain(customToken);
		}
	});

	test('uses a new rate-limit identity when the configured token rotates', async () => {
		const fetchMock = vi.fn(async () => createResponse('shared-hash'));
		const api = createApi(fetchMock);
		const route = `/channels/${channelId}/messages` as const;

		await api.request('GET', route);
		block(api.ratelimits.get(api.routefy(route, 'GET'))!);
		api.options.token = 'rotated-token';

		await expect(api.request('GET', route)).resolves.toEqual({ ok: true });
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});

	test('isolates webhook-token majors without storing raw tokens in bucket keys', async () => {
		const firstToken = 'a'.repeat(68);
		const secondToken = 'b'.repeat(68);
		const webhookId = '300000000000000001';
		const firstWebhook = `/webhooks/${webhookId}/${firstToken}` as const;
		const secondWebhook = `/webhooks/${webhookId}/${secondToken}` as const;
		const fetchMock = vi.fn(async () => createResponse('shared-hash'));
		const api = createApi(fetchMock);

		await api.request('GET', firstWebhook, { auth: false });
		block(api.ratelimits.get(api.routefy(firstWebhook, 'GET'))!);

		await expect(api.request('GET', secondWebhook, { auth: false })).resolves.toEqual({ ok: true });
		expect(fetchMock).toHaveBeenCalledTimes(2);
		for (const key of api.ratelimits.keys()) {
			expect(key).not.toContain(firstToken);
			expect(key).not.toContain(secondToken);
		}
	});
});
