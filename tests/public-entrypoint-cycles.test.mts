import { describe, expect, test, vi } from 'vitest';

describe('public entrypoint cycles', () => {
	test('keeps GuildRole available after command contexts are loaded directly', async () => {
		vi.resetModules();

		await import('../src/commands/applications/chatcontext');
		const { GuildRole } = await import('../src');

		expect(typeof GuildRole).toBe('function');
	});
});
