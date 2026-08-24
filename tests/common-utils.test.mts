import { mockId } from '@slipher/testing';
import { describe, expect, test } from 'vitest';
import { resolveColor, snowflakeToTimestamp } from '../lib/common/it/utils';

describe('resolveColor', () => {
	test('rejects invalid hex strings', () => {
		expect(() => resolveColor('#zzzzzz')).toThrowError('Invalid color: #zzzzzz');
	});
});

describe('snowflakeToTimestamp', () => {
	test('returns the unix millisecond timestamp as a number', () => {
		const timestamp = Date.UTC(2024, 0, 2, 3, 4, 5);

		expect(snowflakeToTimestamp(mockId({ at: timestamp }))).toBe(timestamp);
	});
});
