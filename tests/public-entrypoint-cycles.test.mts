import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { describe, expect, test, vi } from 'vitest';
// Keep the deep import first: this regression exercises loading the cache base before the public entrypoint.
import { BaseResource } from '../src/cache/resources/default/base';
import { Cache } from '../src';

describe('public entrypoint cycles', () => {
	test('keeps disabled tracking usable when async context support is unavailable', async () => {
		const { stdout, stderr } = await promisify(execFile)(
			process.execPath,
			[
				'--eval',
				`
			const Module = require('node:module');
			const load = Module._load;
			Module._load = function (id, ...args) {
				if (id === 'node:async_hooks' || id === 'async_hooks') throw new Error('Async context is unavailable');
				return load.call(this, id, ...args);
			};
			const { Client } = require('./lib/index.js');
			const client = new Client();
			client.cache.onPacket({ t: 'GUILD_CREATE', d: { id: 'guild-1', member_count: 10 } }).then(async () => {
				if ((await client.cache.guilds.raw('guild-1')).member_count !== 10) throw new Error('Cache write lost');
				console.log('completed');
			}).catch(error => { console.error(error); process.exitCode = 1; });
		`,
			],
			{ timeout: 5_000 },
		);
		expect(stdout.trim()).toBe('completed');
		expect(stderr).toBe('');
	});

	test('tracks member counts through the emitted public entrypoint', async () => {
		const { stdout, stderr } = await promisify(execFile)(
			process.execPath,
			[
				'--eval',
				`
			const { Client } = require('./lib/index.js');
			const client = new Client();
			client.setServices({ cache: { trackMemberCount: true } });
			(async () => {
				await client.cache.onPacket({ t: 'GUILD_CREATE', d: { id: 'guild-1', member_count: 10 } });
				await Promise.all([
					client.cache.onPacket({ t: 'GUILD_MEMBER_ADD', d: { guild_id: 'guild-1', user: { id: 'user-1' } } }),
					client.cache.onPacket({ t: 'GUILD_MEMBER_REMOVE', d: { guild_id: 'guild-1', user: { id: 'user-1' } } }),
				]);
				if ((await client.cache.guilds.raw('guild-1')).member_count !== 10) throw new Error('Count update lost');
				console.log('completed');
			})().catch(error => { console.error(error); process.exitCode = 1; });
		`,
			],
			{ timeout: 5_000 },
		);
		expect(stdout.trim()).toBe('completed');
		expect(stderr).toBe('');
	});

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
