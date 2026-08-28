import { describe, expect, test } from 'vitest';
import { SeyfertError, SeyfertErrorMessages } from '../src/common/it/error';

describe('SeyfertError', () => {
	test('detects instances and codes', () => {
		const error = new SeyfertError('INVALID_TOKEN');

		expect(SeyfertError.is(error)).toBe(true);
		expect(SeyfertError.is(error, 'INVALID_TOKEN')).toBe(true);
		expect(SeyfertError.is(error, 'BAD_OPTION')).toBe(false);
		expect(SeyfertError.is(new Error('Invalid token.'))).toBe(false);
	});

	test('preserves catalog messages regardless of metadata detail', () => {
		expect(new SeyfertError('INVALID_TOKEN').message).toBe('Invalid token.');
		expect(new SeyfertError('INVALID_EMOJI', { metadata: { detail: '  Invalid   Emoji  ' } }).message).toBe(
			'Invalid emoji.',
		);
		expect(new SeyfertError('INTERNAL_ERROR', { metadata: { detail: '  Worker #4 does not exist.  ' } }).message).toBe(
			'Internal error.',
		);
		expect(new SeyfertError('BAD_OPTION', { metadata: { detail: 'Bad Option!!!' } }).message).toBe('Bad option.');
	});

	test('titleizes uncataloged codes without changing message behavior from metadata', () => {
		expect(new SeyfertError('INVALID_TOKEN', { metadata: { detail: '   ' } }).message).toBe('Invalid token.');
		expect(new SeyfertError('CUSTOM_RUNTIME_FAILURE', { metadata: { detail: 'Custom runtime detail.' } }).message).toBe(
			'Custom Runtime Failure',
		);
		expect(new SeyfertError('CUSTOM_RUNTIME_FAILURE').message).toBe('Custom Runtime Failure');
	});

	test('treats inherited object property names as uncataloged codes', () => {
		expect(new SeyfertError('toString').message).toBe('Tostring');
		expect(new SeyfertError('constructor').message).toBe('Constructor');
		expect(new SeyfertError('__proto__').message).toBe('Proto');
	});

	test('captures message at construction and preserves structured context', () => {
		const cause = new Error('worker failed');
		const metadata: Record<string, unknown> = { detail: 'Worker #4 does not exist.', workerId: 4 };
		const error = new SeyfertError('INTERNAL_ERROR', { metadata, cause });
		metadata.detail = 'Worker #5 does not exist.';

		expect(error.message).toBe('Internal error.');
		expect(error.metadata).toBe(metadata);
		expect(error.cause).toBe(cause);
	});

	test('catalogs builder validation codes', () => {
		expect(SeyfertErrorMessages).toMatchObject({
			MISSING_MEDIA: 'Cannot convert to JSON without media.',
			MISSING_MODAL_CUSTOM_ID: 'Cannot convert to JSON without a custom_id.',
			MISSING_MODAL_TITLE: 'Cannot convert to JSON without a title.',
			MISSING_POLL_QUESTION: 'Cannot convert to JSON without a question.',
			MISSING_POLL_ANSWERS: 'Cannot convert to JSON without answers.',
			MISSING_RADIO_GROUP_OPTION_LABEL: 'Cannot convert to JSON without a label.',
			MISSING_RADIO_GROUP_OPTION_VALUE: 'Cannot convert to JSON without a value.',
			MISSING_STRING_SELECT_OPTION_LABEL: 'Cannot convert to JSON without a label.',
			MISSING_STRING_SELECT_OPTION_VALUE: 'Cannot convert to JSON without a value.',
		});
	});
});
