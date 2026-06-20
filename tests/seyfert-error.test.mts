import { describe, expect, test } from 'vitest';
import { SeyfertError } from '../lib/common/it/error';

describe('SeyfertError.is', () => {
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
});
