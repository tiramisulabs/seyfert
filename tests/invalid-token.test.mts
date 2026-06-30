import { afterEach, describe, expect, test, vi } from 'vitest';
import { ApiHandler } from '../src/api/api';
import { BaseClient } from '../src/client/base';
import { Client } from '../src/client/client';
import { SeyfertError } from '../src/common';

const invalidTokenMetadata = { detail: 'token is not a string' };

function missingTokenConfig() {
	return {
		locations: { base: '' },
		intents: 0,
	} as never;
}

async function expectInvalidTokenRejection(promise: Promise<unknown>) {
	let thrown: unknown;

	try {
		await promise;
	} catch (error) {
		thrown = error;
	}

	expect(thrown).toBeInstanceOf(SeyfertError);
	expect(thrown).toMatchObject({
		code: 'INVALID_TOKEN',
		metadata: invalidTokenMetadata,
	});
}

describe('invalid token handling', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	test('BaseClient.start rejects missing config tokens with INVALID_TOKEN', async () => {
		const client = new BaseClient({ getRC: missingTokenConfig });

		await expectInvalidTokenRejection(client.start());
	});

	test('Client.start rejects missing config tokens with INVALID_TOKEN', async () => {
		const client = new Client({ getRC: missingTokenConfig });

		await expectInvalidTokenRejection(client.start());
	});

	test('authenticated REST requests reject INVALID_TOKEN before fetch', async () => {
		const fetchMock = vi.fn(async () => new Response('{}', { headers: { 'content-type': 'application/json' } }));
		vi.stubGlobal('fetch', fetchMock);
		const api = new ApiHandler({ token: 'INVALID' });

		await expectInvalidTokenRejection(api.request('GET', '/users/@me'));

		expect(fetchMock).not.toHaveBeenCalled();
	});

	test('auth false REST requests omit Authorization and still call fetch with INVALID token', async () => {
		const fetchMock = vi.fn<typeof fetch>(
			async () => new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } }),
		);
		vi.stubGlobal('fetch', fetchMock);
		const api = new ApiHandler({ token: 'INVALID', domain: 'https://discord.example' });

		await expect(api.request('GET', '/users/@me', { auth: false })).resolves.toEqual({});

		expect(fetchMock).toHaveBeenCalledTimes(1);
		expect(fetchMock.mock.calls[0]?.[0]).toBe('https://discord.example/api/v10/users/@me');
		expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
			method: 'GET',
			headers: {
				'User-Agent': expect.any(String),
			},
		});
		expect((fetchMock.mock.calls[0]?.[1] as RequestInit).headers).not.toHaveProperty('Authorization');
	});
});
