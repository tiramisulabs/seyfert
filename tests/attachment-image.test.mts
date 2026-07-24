import { afterEach, describe, expect, test, vi } from 'vitest';
import { AttachmentFlags } from '../src/types';
import { Attachment, AttachmentBuilder, resolveAttachment, resolveImage } from '../src/builders/Attachment';

describe('attachment spoilers', () => {
	test('serializes new spoilers with request metadata without renaming the file', () => {
		const attachment = new AttachmentBuilder().setName('image.png').setSpoiler(true);

		expect(attachment.data.filename).toBe('image.png');
		expect(attachment.spoiler).toBe(true);
		expect(resolveAttachment(attachment)).toMatchObject({ filename: 'image.png', is_spoiler: true });
	});

	test('recognizes and can remove the legacy spoiler filename prefix', () => {
		const attachment = new AttachmentBuilder().setName('SPOILER_image.png');

		expect(attachment.spoiler).toBe(true);

		attachment.setSpoiler(false);

		expect(attachment.data.filename).toBe('image.png');
		expect(resolveAttachment(attachment)).toMatchObject({ filename: 'image.png', is_spoiler: false });
	});

	test('reads spoiler state from attachment flags with a legacy filename fallback', () => {
		const flagged = new Attachment({} as never, {
			id: '1',
			filename: 'image.png',
			size: 3,
			url: 'https://cdn.example/image.png',
			proxy_url: 'https://cdn.example/image.png',
			flags: AttachmentFlags.IsSpoiler,
		});
		const legacy = new Attachment({} as never, {
			id: '2',
			filename: 'SPOILER_image.png',
			size: 3,
			url: 'https://cdn.example/legacy.png',
			proxy_url: 'https://cdn.example/legacy.png',
		});

		expect(flagged.spoiler).toBe(true);
		expect(legacy.spoiler).toBe(true);
	});
});

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
		const attachment = new Attachment({} as never, {
			id: '1',
			filename: 'image.png',
			size: 3,
			url: 'https://cdn.example/image.png',
			proxy_url: 'https://cdn.example/image.png',
			content_type: 'image/png',
		} as never);

		await expect(resolveImage(attachment)).resolves.toBe('data:image/png;base64,YWJj');
	});

	test('converts buffer-like image data to a data URL', async () => {
		await expect(resolveImage({ type: 'buffer', data: new Uint8Array([97, 98, 99]) })).resolves.toBe(
			'data:image/jpeg;base64,YWJj',
		);
	});
});
