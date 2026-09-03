import { apiUser, createMockBot, mockWorld, Routes } from '@slipher/testing';
import { describe, expect, test, vi } from 'vitest';
import { Command, type CommandContext, Declare, GuildMember } from '../lib';
import { CommandContext as InternalCommandContext } from '../src/commands/applications/chatcontext';

type FetchMode = 'cache' | 'flow' | 'rest';

function fetchMemberCommand(fetchMode: FetchMode, onFetch?: (member: unknown) => void) {
	class FetchMemberCommand extends Command {
		async run(ctx: CommandContext) {
			const fetched = fetchMode === 'cache' ? ctx.fetchMember('cache') : ctx.fetchMember(fetchMode);
			onFetch?.(fetched);
			const member = await fetched;
			await ctx.write({ content: member?.user.id ?? 'none' });
		}
	}

	return Declare({ name: 'fetch-member', description: 'Fetch the invoking member' })(FetchMemberCommand);
}

function memberWorld() {
	const world = mockWorld();
	const guild = world.registerGuild();
	const user = apiUser({ username: 'author' });
	const member = world.registerMember(guild.id, { user });
	return { guild, member, user, world };
}

function createAsyncContext(guildId?: string) {
	const cacheGet = vi.fn(() => Promise.resolve(undefined));
	const fetch = vi.fn(() => Promise.resolve(undefined));
	const ctx = Object.create(InternalCommandContext.prototype);
	Object.assign(ctx, {
		interaction: { guildId, user: { id: 'author-1' } },
		client: {
			cache: { adapter: { isAsync: true }, members: { get: cacheGet } },
			members: { fetch },
		},
	});
	return { cacheGet, ctx: ctx as InternalCommandContext, fetch };
}

describe('CommandContext.fetchMember', () => {
	test('returns the invoking author member from the real cache', async () => {
		const { guild, member, user, world } = memberWorld();
		let fetchedFromCache: unknown;
		await using bot = await createMockBot({
			commands: [fetchMemberCommand('cache', member => (fetchedFromCache = member))],
			world,
		});

		const result = await bot.slash({ name: 'fetch-member', guildId: guild.id, user, member });

		expect(fetchedFromCache).toBeInstanceOf(GuildMember);
		expect(fetchedFromCache).not.toBeInstanceOf(Promise);
		expect((fetchedFromCache as GuildMember).user.id).toBe(user.id);
		expect(result.content).toBe(user.id);
		expect(bot.restCalls(Routes.fetchMember)).toHaveLength(0);
	});

	test('fetches the invoking author member through flow mode after a cache miss', async () => {
		const { guild, member, user, world } = memberWorld();
		await using bot = await createMockBot({ commands: [fetchMemberCommand('flow')], world });
		await bot.client.cache.members?.remove(user.id, guild.id);

		const result = await bot.slash({ name: 'fetch-member', guildId: guild.id, user, member });

		expect(result.content).toBe(user.id);
		expect(bot.restCalls(Routes.fetchMember)).toContainEqual(
			expect.objectContaining({ params: { guildId: guild.id, userId: user.id } }),
		);
	});

	test('fetches the invoking author member through rest mode even with a cache hit', async () => {
		const { guild, member, user, world } = memberWorld();
		await using bot = await createMockBot({ commands: [fetchMemberCommand('rest')], world });

		const result = await bot.slash({ name: 'fetch-member', guildId: guild.id, user, member });

		expect(result.content).toBe(user.id);
		expect(bot.restCalls(Routes.fetchMember)).toContainEqual(
			expect.objectContaining({ params: { guildId: guild.id, userId: user.id } }),
		);
	});

	test('returns undefined outside guilds without fetching', async () => {
		await using bot = await createMockBot({ commands: [fetchMemberCommand('rest')] });

		const result = await bot.slash({ name: 'fetch-member', guildId: null });

		expect(result.content).toBe('none');
		expect(bot.restCalls(Routes.fetchMember)).toHaveLength(0);
	});

	test('returns promise fallbacks for async cache misses', async () => {
		const { cacheGet, ctx, fetch } = createAsyncContext('guild-1');

		const cached = ctx.fetchMember('cache');

		expect(cached).toBeInstanceOf(Promise);
		await expect(cached).resolves.toBeUndefined();
		expect(cacheGet).toHaveBeenCalledWith('author-1', 'guild-1');
		expect(fetch).not.toHaveBeenCalled();
	});

	test('returns promise fallbacks outside guilds with async cache', async () => {
		const { cacheGet, ctx, fetch } = createAsyncContext();

		const cached = ctx.fetchMember('cache');

		expect(cached).toBeInstanceOf(Promise);
		await expect(cached).resolves.toBeUndefined();
		expect(cacheGet).not.toHaveBeenCalled();
		expect(fetch).not.toHaveBeenCalled();
	});
});
