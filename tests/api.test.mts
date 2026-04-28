import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiHandler } from '../src/api/api';

type PromiseOutcome<T> =
	| { status: 'resolved'; value: T }
	| { status: 'rejected'; error: unknown }
	| { status: 'pending' };

const ratelimitHeaders = {
	'content-type': 'application/json',
	'x-ratelimit-limit': '1',
	'x-ratelimit-remaining': '1',
};

function createJsonResponse(status: number, body: unknown) {
	return new Response(JSON.stringify(body), {
		status,
		headers: ratelimitHeaders,
	});
}

function createTextResponse(status: number, body: string) {
	return new Response(body, {
		status,
		headers: {
			...ratelimitHeaders,
			'content-type': 'text/plain',
		},
	});
}

async function observeWithin<T>(promise: Promise<T>, ms: number): Promise<PromiseOutcome<T>> {
	const tracked = promise.then<PromiseOutcome<T>>(
		value => ({ status: 'resolved', value }),
		error => ({ status: 'rejected', error }),
	);
	const pending = new Promise<PromiseOutcome<T>>(resolve => {
		setTimeout(() => resolve({ status: 'pending' }), ms);
	});

	const outcome = Promise.race([tracked, pending]);
	await vi.advanceTimersByTimeAsync(ms);
	return outcome;
}

function observeWithinReal<T>(promise: Promise<T>, ms: number): Promise<PromiseOutcome<T>> {
	const tracked = promise.then<PromiseOutcome<T>>(
		value => ({ status: 'resolved', value }),
		error => ({ status: 'rejected', error }),
	);
	const pending = new Promise<PromiseOutcome<T>>(resolve => {
		setTimeout(() => resolve({ status: 'pending' }), ms);
	});

	return Promise.race([tracked, pending]);
}

describe('ApiHandler', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
		vi.useRealTimers();
	});

	it('recovers the route bucket after a timed out fetch', async () => {
		vi.useRealTimers();

		let calls = 0;
		const fetchMock = vi.fn((_url: string | URL | Request, init?: RequestInit) => {
			calls++;
			if (calls === 1) {
				return new Promise<Response>((_resolve, reject) => {
					const signal = init?.signal;
					if (!signal) return;

					if (signal.aborted) {
						reject(signal.reason);
						return;
					}

					signal.addEventListener(
						'abort',
						() => reject(signal.reason ?? new DOMException('Request timed out', 'TimeoutError')),
						{ once: true },
					);
				});
			}

			return Promise.resolve(createJsonResponse(200, { ok: true }));
		});

		vi.stubGlobal('fetch', fetchMock);

		const api = new ApiHandler({
			token: 'token',
			requestTimeout: 50,
		});

		void api.request('POST', '/interactions/1/token/callback').catch(() => undefined);
		const secondRequest = api.request('POST', '/interactions/1/token/callback');

		await expect(observeWithinReal(secondRequest, 80)).resolves.toEqual({
			status: 'resolved',
			value: { ok: true },
		});
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});

	it('resolves the original request after 50X retries succeed', async () => {
		vi.spyOn(Math, 'random').mockReturnValue(0);

		const fetchMock = vi
			.fn()
			.mockResolvedValueOnce(createTextResponse(502, 'bad gateway'))
			.mockResolvedValueOnce(createTextResponse(503, 'service unavailable'))
			.mockResolvedValueOnce(createJsonResponse(200, { ok: true }));

		vi.stubGlobal('fetch', fetchMock);

		const api = new ApiHandler({ token: 'token' });
		const request = api.request('POST', '/channels/123/messages', {
			body: { content: 'hello' },
		});

		await expect(observeWithin(request, 250)).resolves.toEqual({
			status: 'resolved',
			value: { ok: true },
		});
		expect(fetchMock).toHaveBeenCalledTimes(3);
	});

	it('rejects after the maximum number of 50X retries and unblocks the bucket', async () => {
		vi.spyOn(Math, 'random').mockReturnValue(0);

		const fetchMock = vi
			.fn()
			.mockResolvedValueOnce(createTextResponse(502, 'bad gateway'))
			.mockResolvedValueOnce(createTextResponse(502, 'bad gateway'))
			.mockResolvedValueOnce(createTextResponse(503, 'service unavailable'))
			.mockResolvedValueOnce(createTextResponse(502, 'still bad'))
			.mockResolvedValueOnce(createJsonResponse(200, { ok: true }));

		vi.stubGlobal('fetch', fetchMock);

		const api = new ApiHandler({ token: 'token' });
		const failedRequest = api.request('POST', '/channels/123/messages', {
			body: { content: 'retry me' },
		});

		await expect(observeWithin(failedRequest, 350)).resolves.toMatchObject({
			status: 'rejected',
		});
		const followUpRequest = api.request('POST', '/channels/123/messages', {
			body: { content: 'next' },
		});
		await expect(observeWithin(followUpRequest, 10)).resolves.toEqual({
			status: 'resolved',
			value: { ok: true },
		});
		expect(fetchMock).toHaveBeenCalledTimes(5);
	});

	it('does not block the bucket while onFailRequest is still running', async () => {
		const fetchMock = vi
			.fn()
			.mockRejectedValueOnce(new Error('socket hang up'))
			.mockResolvedValueOnce(createJsonResponse(200, { ok: true }));

		vi.stubGlobal('fetch', fetchMock);

		const api = new ApiHandler({ token: 'token' });
		api.onFailRequest = () => new Promise(resolve => setTimeout(resolve, 500));

		void api.request('GET', '/channels/123').catch(() => undefined);
		const secondRequest = api.request('GET', '/channels/123');

		await expect(observeWithin(secondRequest, 10)).resolves.toEqual({
			status: 'resolved',
			value: { ok: true },
		});
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});
});
