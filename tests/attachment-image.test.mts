import { describe, expect, test } from 'vitest';
import { AttachmentFlags } from '../src/types';
import { Attachment, AttachmentBuilder, resolveAttachment } from '../src/builders/Attachment';
import { MessagesMethods } from '../src/structures/channels';
import { BaseInteraction } from '../src/structures/Interaction';

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

	test('serializes spoiler metadata for uploaded files', () => {
		const file = new AttachmentBuilder().setName('image.png').setDescription('alt text').setSpoiler(true);
		const expected = [{ id: '0', filename: 'image.png', description: 'alt text', is_spoiler: true }];

		expect(MessagesMethods.transformMessageBody({}, [file], { options: {} } as never).attachments).toEqual(expected);
		expect(BaseInteraction.transformBody({}, [file], { options: {} } as never).attachments).toEqual(expected);
	});
});
