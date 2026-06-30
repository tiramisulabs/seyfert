import { describe, expect, test, vi } from 'vitest';
import type { MockInstance } from 'vitest';
import { ApiHandler } from '../src/api/api';
import { Bucket } from '../src/api/bucket';
import type { ApiRequestOptions, HttpMethods } from '../src/api/shared';

const route = '/channels/:id/messages' as const;
const method: HttpMethods = 'POST';
const url = '/channels/100000000000000001/messages' as const;

function createApi() {
	return new ApiHandler({ token: 'bot-token' });
}

function createRetryRequest(): ApiRequestOptions {
	return {
		body: { content: 'hello' },
		query: { around: '200000000000000002', limit: 50 },
		files: [
			{
				data: new Uint8Array([1, 2, 3]),
				filename: 'payload.bin',
				contentType: 'application/octet-stream',
			},
		],
		auth: false,
		reason: 'retry audit reason',
		route,
		unshift: false,
		appendToFormData: true,
		token: 'request-token',
	};
}

function expectRequestOptionsPreserved(
	requestSpy: MockInstance<ApiHandler['request']>,
	request: ApiRequestOptions,
) {
	expect(requestSpy).toHaveBeenCalledWith(method, url, {
		...request,
		unshift: true,
	});
}

function createRetryScenario() {
	const retried = { ok: true };
	const api = createApi();
	const request = createRetryRequest();
	const requestSpy = vi.spyOn(api, 'request').mockResolvedValue(retried as never);
	const next = vi.fn();

	return { api, next, request, requestSpy, retried };
}

async function flushRetryContinuations() {
	await Promise.resolve();
	await Promise.resolve();
	await Promise.resolve();
}

describe('REST retry request options', () => {
	test('handle50X preserves every request option and forces unshift on retry', async () => {
		vi.useFakeTimers();
		try {
			const { api, next, request, requestSpy, retried } = createRetryScenario();
			const retry = api.handle50X(method, url, request, next);

			await vi.advanceTimersByTimeAsync(2_000);

			await expect(retry).resolves.toBe(retried);
			expectRequestOptionsPreserved(requestSpy, request);
		} finally {
			vi.useRealTimers();
		}
	});

	test('handle429 preserves every request option and forces unshift after a positive retry delay', async () => {
		vi.useFakeTimers();
		try {
			const { api, next, request, requestSpy, retried } = createRetryScenario();
			api.ratelimits.set(route, new Bucket(1));
			const response = new Response(JSON.stringify({ retry_after: 0.001 }), { status: 429 });
			const retry = api.handle429(
				route,
				method,
				url,
				request,
				response,
				JSON.stringify({ retry_after: 0.001 }),
				next,
				vi.fn(),
				Date.now(),
				url,
			);

			await flushRetryContinuations();
			expect(requestSpy).not.toHaveBeenCalled();
			expect(next).not.toHaveBeenCalled();

			await vi.advanceTimersByTimeAsync(1);

			await expect(retry).resolves.toBe(retried);
			expect(next).toHaveBeenCalledTimes(1);
			expectRequestOptionsPreserved(requestSpy, request);
		} finally {
			vi.useRealTimers();
		}
	});

	test('handle429 preserves every request option and forces unshift when retryAfter is zero', async () => {
		vi.useFakeTimers();
		try {
			const { api, next, request, requestSpy, retried } = createRetryScenario();
			api.ratelimits.set(route, new Bucket(1));
			const response = new Response(JSON.stringify({ retry_after: 0 }), { status: 429 });
			const retry = api.handle429(
				route,
				method,
				url,
				request,
				response,
				JSON.stringify({ retry_after: 0 }),
				next,
				vi.fn(),
				Date.now(),
				url,
			);

			await expect(retry).resolves.toBe(retried);
			expect(next).toHaveBeenCalledTimes(1);
			expectRequestOptionsPreserved(requestSpy, request);
		} finally {
			vi.useRealTimers();
		}
	});
});
