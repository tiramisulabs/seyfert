import { describe, expect, test } from 'vitest';
import { SeyfertError } from '../lib/common/it/error';

describe('SeyfertError', () => {
	test('detects SeyfertError instances', () => {
		const error = new SeyfertError('INVALID_TOKEN');

		expect(SeyfertError.is(error)).toBe(true);
		expect(SeyfertError.is(new Error('Invalid token.'))).toBe(false);
	});

	test('detects SeyfertError instances by code', () => {
		const error = new SeyfertError('INVALID_TOKEN');

		expect(SeyfertError.is(error, 'INVALID_TOKEN')).toBe(true);
		expect(SeyfertError.is(error, 'BAD_OPTION')).toBe(false);
	});

	test('uses catalog messages when detail is absent or equivalent', () => {
		expect(new SeyfertError('INVALID_TOKEN').message).toBe('Invalid token.');
		expect(
			new SeyfertError('INVALID_EMOJI', {
				metadata: { detail: '  Invalid   Emoji  ' },
			}).message,
		).toBe('Invalid emoji.');
	});

	test('uses informative detail without normalizing meaningful differences', () => {
		expect(
			new SeyfertError('INTERNAL_ERROR', {
				metadata: { detail: '  Worker #4 does not exist.  ' },
			}).message,
		).toBe('Worker #4 does not exist.');
		expect(new SeyfertError('BAD_OPTION', { metadata: { detail: 'Bad Option!!!' } }).message).toBe('Bad Option!!!');
		expect(
			new SeyfertError('CACHE_USERS_COUNT_NOT_ZERO', {
				metadata: { detail: 'Users count should be 0.' },
			}).message,
		).toBe('Users count should be 0.');
	});

	test('falls back when detail is empty or the code is not cataloged', () => {
		expect(new SeyfertError('INVALID_TOKEN', { metadata: { detail: '   ' } }).message).toBe('Invalid token.');
		expect(
			new SeyfertError('CUSTOM_RUNTIME_FAILURE', {
				metadata: { detail: 'Custom runtime detail.' },
			}).message,
		).toBe('Custom runtime detail.');
		expect(new SeyfertError('CUSTOM_RUNTIME_FAILURE').message).toBe('Custom Runtime Failure');
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
