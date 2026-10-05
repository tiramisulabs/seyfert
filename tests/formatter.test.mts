import { assert, describe, test } from 'vitest';
import { Formatter } from '../lib/common/it/formatter';

describe('Formatter.timestamp', () => {
	const timestampMs = Date.UTC(2024, 0, 2, 3, 4, 5, 678);
	const timestampSeconds = Math.floor(timestampMs / 1000);

	test('formats Date and unix millisecond timestamps with the default relative style', () => {
		const expected = `<t:${timestampSeconds}:R>`;

		assert.equal(Formatter.timestamp(new Date(timestampMs)), expected);
		assert.equal(Formatter.timestamp(timestampMs), expected);
	});
});
