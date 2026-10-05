import { describe, expect, test } from 'vitest';
import { SeyfertError } from '../lib/common/it/error';

describe('SeyfertError', () => {
	test('detects SeyfertError instances by code', () => {
		const error = new SeyfertError('INVALID_TOKEN');

		expect(SeyfertError.is(error, 'INVALID_TOKEN')).toBe(true);
		expect(SeyfertError.is(error, 'BAD_OPTION')).toBe(false);
	});

	test('treats inherited object property names as uncataloged codes', () => {
		for (const code of ['toString', 'constructor', '__proto__']) {
			expect(new SeyfertError(code, { metadata: { detail: `Detail for ${code}.` } }).message).toBe(
				`Detail for ${code}.`,
			);
		}
	});

	test('captures message at construction and preserves structured context', () => {
		const cause = new Error('worker failed');
		const metadata: Record<string, unknown> = { detail: 'Worker #4 does not exist.', workerId: 4 };
		const error = new SeyfertError('INTERNAL_ERROR', { metadata, cause });

		metadata.detail = 'Worker #5 does not exist.';

		expect(error.message).toBe('Worker #4 does not exist.');
		expect(error.code).toBe('INTERNAL_ERROR');
		expect(error.metadata).toBe(metadata);
		expect(error.cause).toBe(cause);
	});
});
