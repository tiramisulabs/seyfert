import { describe, expect, test, vi } from 'vitest';
import { CommandHandler } from '../src/commands/handler';
import {
	type APIApplicationCommandAttachmentOption,
	ApplicationCommandOptionType,
	type FileUploadType,
} from '../src/types';

class ExposedCommandHandler extends CommandHandler {
	shouldUploadAttachment(option: APIApplicationCommandAttachmentOption, cached: APIApplicationCommandAttachmentOption) {
		return this.shouldUploadOption(option, cached);
	}
}

function attachment(fileTypes?: FileUploadType[]): APIApplicationCommandAttachmentOption {
	return {
		type: ApplicationCommandOptionType.Attachment,
		name: 'document',
		description: 'Upload a document',
		file_types: fileTypes,
	};
}

function createCommandHandler() {
	const logger = { warn: vi.fn(), error: vi.fn() };
	const client = { langs: { values: {} }, options: {} };
	return new ExposedCommandHandler(logger as never, client as never);
}

describe('file type filtering', () => {
	test('detects changes to attachment option filters before uploading commands', () => {
		const handler = createCommandHandler();

		expect(handler.shouldUploadAttachment(attachment(['image', '.pdf']), attachment(['.pdf', 'image']))).toBe(false);
		expect(handler.shouldUploadAttachment(attachment(['image']), attachment(['video']))).toBe(true);
		expect(handler.shouldUploadAttachment(attachment(['image', '.pdf']), attachment(['image']))).toBe(true);
		expect(handler.shouldUploadAttachment(attachment([]), attachment())).toBe(true);
	});
});
