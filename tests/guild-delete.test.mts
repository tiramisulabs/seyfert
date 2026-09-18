import { apiGuild, createMockBot } from '@slipher/testing';
import { describe, expect, test, vi } from 'vitest';
import { CacheFrom, Client, createEvent, Guild, LimitedMemoryAdapter, MemoryAdapter } from '../lib';

describe.each([
	['MemoryAdapter', MemoryAdapter],
	['LimitedMemoryAdapter', LimitedMemoryAdapter],
] as const)('guildDelete with %s', (_name, Adapter) => {
	test.each([true, false, undefined])('uses the packet unavailable value %s for cached guilds', async unavailable => {
		const client = new Client();
		client.setServices({ cache: { adapter: new Adapter() } });
		const run = vi.fn();
		await using bot = await createMockBot({
			client,
			events: [
				createEvent({
					data: { name: 'guildDelete' },
					async run(guild) {
						run(guild, await client.cache.guilds?.raw(guild.id));
					},
				}),
			],
		});
		const guild = {
			...apiGuild(),
			joined_at: '2026-01-01T00:00:00.000Z',
			unavailable: unavailable !== true,
		};
		await client.cache.guilds?.set(CacheFrom.Test, guild.id, guild);
		const previous = await client.cache.guilds?.get(guild.id);
		const packet = unavailable === undefined ? { id: guild.id } : { id: guild.id, unavailable };

		await bot.client.events.runEvent('GUILD_DELETE', bot.client, packet, 0);

		expect(run).toHaveBeenCalledTimes(1);
		const [received, cachedDuringHandler] = run.mock.calls[0];
		expect(received).toBeInstanceOf(Guild);
		expect(received).toMatchObject({ id: guild.id, name: guild.name });
		expect(received.unavailable).toBe(unavailable);
		expect(received.iconURL()).toBeUndefined();
		expect(previous?.unavailable).toBe(guild.unavailable);
		expect(packet).toEqual(unavailable === undefined ? { id: guild.id } : { id: guild.id, unavailable });
		if (unavailable) {
			expect(cachedDuringHandler).toMatchObject({ id: guild.id, unavailable: true });
		} else {
			expect(cachedDuringHandler).toBeUndefined();
		}
	});
});

describe('guildDelete without a cached guild', () => {
	test.each([false, true])('preserves raw payloads when guild caching is disabled: %s', async disabled => {
		const client = new Client();
		if (disabled) client.setServices({ cache: { disabledCache: { guilds: true } } });
		const run = vi.fn();
		await using bot = await createMockBot({
			client,
			events: [createEvent({ data: { name: 'guildDelete' }, run })],
		});
		for (const unavailable of [true, false, undefined]) {
			const id = apiGuild().id;
			const packet = unavailable === undefined ? { id } : { id, unavailable };

			await bot.client.events.runEvent('GUILD_DELETE', bot.client, packet, 0);

			expect(run.mock.lastCall?.[0]).toBe(packet);
		}
		expect(run).toHaveBeenCalledTimes(3);
	});
});
