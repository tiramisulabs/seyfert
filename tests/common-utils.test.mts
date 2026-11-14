import { mockId } from '@slipher/testing';
import { describe, expect, test, vi } from 'vitest';
import { resolveColor, resolvePartialEmoji, snowflakeToTimestamp } from '../lib/common/it/utils';

describe('resolveColor', () => {
	test('rejects invalid hex strings', () => {
		expect(() => resolveColor('#zzzzzz')).toThrowError('Invalid color: #zzzzzz');
	});

	test('validates hexadecimal colors by value rather than width', () => {
		expect(() => resolveColor('#1000000')).toThrowError('Invalid color: #1000000');
		expect(resolveColor('#FFFFFF')).toBe(0xffffff);
		expect(resolveColor('#0')).toBe(0);
		expect(resolveColor('#abc')).toBe(0xabc);
		expect(resolveColor('#0000001')).toBe(1);
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

	test('Random covers the whole color range, white included', () => {
		const random = vi.spyOn(Math, 'random');
		try {
			random.mockReturnValue(0);
			expect(resolveColor('Random')).toBe(0);
			random.mockReturnValue(1 - Number.EPSILON);
			expect(resolveColor('Random')).toBe(0xffffff);
		} finally {
			random.mockRestore();
		}
	});
});

describe('snowflakeToTimestamp', () => {
	test('returns the unix millisecond timestamp as a number', () => {
		const timestamp = Date.UTC(2024, 0, 2, 3, 4, 5);

		expect(snowflakeToTimestamp(mockId({ at: timestamp }))).toBe(timestamp);
	});
});

describe('resolvePartialEmoji', () => {
	test('does not encode an already encoded emoji twice', () => {
		expect(resolvePartialEmoji('%F0%9F%91%8D')).toEqual({ name: '👍', id: null });
		expect(resolvePartialEmoji('👍')).toEqual({ name: '👍', id: null });
	});

	test('resolves unicode emojis passed as objects', () => {
		expect(resolvePartialEmoji({ name: '👍' })).toEqual({ name: '👍', id: null });
		expect(resolvePartialEmoji({ name: '👍', id: null })).toEqual({ name: '👍', id: null });
	});

	test('keeps resolving custom emojis passed as objects', () => {
		expect(resolvePartialEmoji({ name: 'seyfert', id: '123456789012345678' })).toEqual({
			name: 'seyfert',
			id: '123456789012345678',
			animated: false,
		});
		expect(resolvePartialEmoji({ id: '123456789012345678' })).toBeUndefined();
	});
});
