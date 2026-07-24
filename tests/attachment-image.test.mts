import { apiAttachment } from '@slipher/testing';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { Attachment, resolveImage } from '../src/builders/Attachment';

describe('resolveImage', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	test('converts fetched Attachment data to a data URL', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn(async () => {
				return new Response(new Uint8Array([97, 98, 99]), {
					status: 200,
					headers: { 'content-type': 'image/png' },
				});
			}),
		);
		const attachment = new Attachment(
			{} as never,
			apiAttachment({
				id: '1',
				filename: 'image.png',
				size: 3,
				url: 'https://cdn.example/image.png',
				contentType: 'image/png',
			}),
		);

		await expect(resolveImage(attachment)).resolves.toBe('data:image/png;base64,YWJj');
	});

	test('converts buffer-like image data to a data URL', async () => {
		await expect(resolveImage({ type: 'buffer', data: new Uint8Array([97, 98, 99]) })).resolves.toBe(
			'data:image/jpeg;base64,YWJj',
		);
	});
});
