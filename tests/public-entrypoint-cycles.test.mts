import { describe, expect, test, vi } from 'vitest';
import { BaseResource } from '../src/cache/resources/default/base';
import { Cache } from '../src';

describe('public entrypoint cycles', () => {
	test('keeps GuildRole available after command contexts are loaded directly', async () => {
		vi.resetModules();

		await import('../src/commands/applications/chatcontext');
		const { GuildRole } = await import('../src');

		expect(typeof GuildRole).toBe('function');
	});

	test('keeps cache base resources available through the public entrypoint', () => {
		expect(typeof BaseResource).toBe('function');
		expect(typeof Cache).toBe('function');
	});
});
