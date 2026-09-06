import { createMockBot } from '@slipher/testing';
import { describe, expect, test } from 'vitest';
import { Client } from '../lib';

describe('@slipher/testing harness', () => {
	test('boots against the current source checkout', async () => {
		await using bot = await createMockBot();

		expect(bot.client).toBeInstanceOf(Client);
	});
});
