import { afterEach, describe, expect, test, vi } from 'vitest';
import { Attachment, resolveImage } from '../src/builders/Attachment';

describe('resolveImage', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	test('rejects non-ok responses when resolving an Attachment URL', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn(async () => new Response('missing', { status: 404, statusText: 'Not Found' })),
		);

		const attachment = new Attachment({} as never, {
			filename: 'missing.png',
			id: '1',
			proxy_url: 'https://cdn.test/missing.png',
			size: 7,
			url: 'https://cdn.test/missing.png',
		});

		await expect(resolveImage(attachment)).rejects.toMatchObject({
			code: 'INVALID_ATTACHMENT_TYPE',
			metadata: expect.objectContaining({
				detail: 'Failed to fetch attachment from URL: 404 Not Found',
			}),
		});
	});
});
