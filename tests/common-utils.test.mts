import { describe, expect, test } from 'vitest';
import { resolveColor } from '../lib/common/it/utils';

describe('resolveColor', () => {
	test('rejects invalid hex strings', () => {
		expect(() => resolveColor('#zzzzzz')).toThrowError('Internal error.');
	});
});
