import { describe, expect, test } from 'vitest';
import { resolveColor, snowflakeToTimestamp } from '../lib/common/it/utils';

describe('resolveColor', () => {
	test('rejects invalid hex strings', () => {
		expect(() => resolveColor('#zzzzzz')).toThrowError('Internal error.');
	});
});

describe('snowflakeToTimestamp', () => {
	test('returns the unix millisecond timestamp as a number', () => {
		expect(snowflakeToTimestamp('0')).toBe(1_420_070_400_000);
	});
});
