import { mockId } from '@slipher/testing';
import { describe, expect, test } from 'vitest';
import { resolveColor, snowflakeToTimestamp } from '../lib/common/it/utils';

describe('resolveColor', () => {
	test('rejects invalid hex strings', () => {
		expect(() => resolveColor('#zzzzzz')).toThrowError('Invalid color: #zzzzzz');
	});

	test('rejects numbers outside the 0-0xFFFFFF range', () => {
		expect(() => resolveColor(-1)).toThrowError('Invalid color: -1');
		expect(() => resolveColor(0xffffff + 1)).toThrowError('Invalid color: 16777216');
		expect(resolveColor(0xffffff)).toBe(0xffffff);
	});

	test('rejects rgb arrays with out of range components', () => {
		expect(() => resolveColor([300, 0, 0])).toThrowError('Invalid color: 300,0,0');
		expect(() => resolveColor([0, -1, 0])).toThrowError('Invalid color: 0,-1,0');
		expect(resolveColor([255, 255, 255])).toBe(0xffffff);
	});
});

describe('snowflakeToTimestamp', () => {
	test('returns the unix millisecond timestamp as a number', () => {
		const timestamp = Date.UTC(2024, 0, 2, 3, 4, 5);

		expect(snowflakeToTimestamp(mockId({ at: timestamp }))).toBe(timestamp);
	});
});
