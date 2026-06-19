import { describe, expect, test, vi } from 'vitest';
import { CommandContext } from '../src/commands/applications/chatcontext';
import type { GuildMemberStructure } from '../src/client/transformers';

const authorId = 'author-1';
const guildId = 'guild-1';

function createContext(options: {
	guildId?: string;
	cachedMember?: GuildMemberStructure;
	fetchedMember?: GuildMemberStructure;
	isAsyncCache?: boolean;
}) {
	const cacheGet = vi.fn(() => options.cachedMember);
	const fetch = vi.fn(() => Promise.resolve(options.fetchedMember));
	const ctx = Object.create(CommandContext.prototype);

	Object.assign(ctx, {
		interaction: {
			guildId: options.guildId,
			user: { id: authorId },
		},
		client: {
			cache: {
				adapter: { isAsync: options.isAsyncCache ?? false },
				members: { get: cacheGet },
			},
			members: { fetch },
		},
	});

	return { cacheGet, ctx: ctx as CommandContext, fetch };
}

describe('CommandContext.fetchMember', () => {
	test('returns the invoking author member from cache', () => {
		const cachedMember = { user: { id: authorId } } as GuildMemberStructure;
		const { cacheGet, ctx, fetch } = createContext({ guildId, cachedMember });

		expect(ctx.fetchMember('cache')).toBe(cachedMember);
		expect(cacheGet).toHaveBeenCalledWith(authorId, guildId);
		expect(fetch).not.toHaveBeenCalled();
	});

	test('fetches the invoking author member through flow mode', async () => {
		const fetchedMember = { user: { id: authorId } } as GuildMemberStructure;
		const { cacheGet, ctx, fetch } = createContext({ guildId, fetchedMember });

		await expect(ctx.fetchMember('flow')).resolves.toBe(fetchedMember);
		expect(fetch).toHaveBeenCalledWith(guildId, authorId, false);
		expect(cacheGet).not.toHaveBeenCalled();
	});

	test('fetches the invoking author member through rest mode', async () => {
		const fetchedMember = { user: { id: authorId } } as GuildMemberStructure;
		const { cacheGet, ctx, fetch } = createContext({ guildId, fetchedMember });

		await expect(ctx.fetchMember('rest')).resolves.toBe(fetchedMember);
		expect(fetch).toHaveBeenCalledWith(guildId, authorId, true);
		expect(cacheGet).not.toHaveBeenCalled();
	});

	test('returns undefined outside guilds without fetching', async () => {
		const { cacheGet, ctx, fetch } = createContext({});

		expect(ctx.fetchMember('cache')).toBeUndefined();
		await expect(ctx.fetchMember('flow')).resolves.toBeUndefined();
		await expect(ctx.fetchMember('rest')).resolves.toBeUndefined();
		expect(cacheGet).not.toHaveBeenCalled();
		expect(fetch).not.toHaveBeenCalled();
	});

	test('returns promise fallbacks for async cache misses', async () => {
		const { cacheGet, ctx, fetch } = createContext({ guildId, isAsyncCache: true });

		const cached = ctx.fetchMember('cache');

		expect(cached).toBeInstanceOf(Promise);
		await expect(cached).resolves.toBeUndefined();
		expect(cacheGet).toHaveBeenCalledWith(authorId, guildId);
		expect(fetch).not.toHaveBeenCalled();
	});

	test('returns promise fallbacks outside guilds with async cache', async () => {
		const { cacheGet, ctx, fetch } = createContext({ isAsyncCache: true });

		const cached = ctx.fetchMember('cache');

		expect(cached).toBeInstanceOf(Promise);
		await expect(cached).resolves.toBeUndefined();
		expect(cacheGet).not.toHaveBeenCalled();
		expect(fetch).not.toHaveBeenCalled();
	});
});
