import { describe, expect, test } from 'vitest';
import { RadioGroup } from '../src/builders/RadioGroup';

describe('error diagnostics', () => {
	test('reports the received RadioGroup options length', () => {
		const menu = new RadioGroup().setCustomId('topics');

		try {
			menu.toJSON();
			throw new Error('Expected RadioGroup validation to fail.');
		} catch (error) {
			expect(error).toMatchObject({
				code: 'INVALID_OPTIONS_LENGTH',
				message: 'Invalid options length.',
				metadata: {
					detail: 'RadioGroup has an invalid options length: expected number of options between 2 and 10, received 0.',
				},
			});
		}
	});
});
