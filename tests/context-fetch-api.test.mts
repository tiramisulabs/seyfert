import { describe, expect, test, vi } from 'vitest';
import {
	BaseContext,
	resolveContextChannel,
	resolveContextGuild,
	resolveContextMember,
} from '../src/commands/basecontext';

class TestContext extends BaseContext {
	channel(channelId: string, mode: 'cache' | 'flow' | 'rest', interactionChannel?: any) {
		return resolveContextChannel(this.client, channelId, mode, interactionChannel);
	}

	member(guildId: string | undefined, memberId: string, mode: 'cache' | 'flow' | 'rest') {
		return resolveContextMember(this.client, guildId, memberId, mode);
	}

	guild(guildId: string | undefined, mode: 'cache' | 'flow' | 'rest', query?: any) {
		return resolveContextGuild(this.client, guildId, mode, query);
	}
}

function createContext(isAsync: boolean) {
	const channelGet = vi.fn(() => (isAsync ? Promise.resolve(undefined) : undefined));
	const memberGet = vi.fn(() => (isAsync ? Promise.resolve(undefined) : undefined));
	const guildGet = vi.fn(() => (isAsync ? Promise.resolve(undefined) : undefined));
	const channelFetch = vi.fn(() => Promise.resolve({ id: 'channel' }));
	const memberFetch = vi.fn(() => Promise.resolve({ id: 'member' }));
	const guildFetch = vi.fn(() => Promise.resolve({ id: 'guild' }));
	const client = {
		cache: {
			adapter: { isAsync },
			channels: { get: channelGet },
			members: { get: memberGet },
			guilds: { get: guildGet },
		},
		channels: { fetch: channelFetch },
		members: { fetch: memberFetch },
		guilds: { fetch: guildFetch },
	};
	return {
		channelFetch,
		channelGet,
		context: new TestContext(client as never),
		guildFetch,
		guildGet,
		memberFetch,
		memberGet,
	};
}

describe('shared context fetch API', () => {
	test.each([false, true])('preserves sync and async cache shapes (async: %s)', async isAsync => {
		const { channelGet, context, guildGet, memberGet } = createContext(isAsync);
		const interactionChannel = { id: 'interaction-channel' };
		const channel = context.channel('channel', 'cache', interactionChannel);
		const member = context.member('guild', 'member', 'cache');
		const guild = context.guild('guild', 'cache');

		expect(channel instanceof Promise).toBe(isAsync);
		expect(member instanceof Promise).toBe(isAsync);
		expect(guild instanceof Promise).toBe(isAsync);
		await expect(Promise.resolve(channel)).resolves.toBe(interactionChannel);
		await expect(Promise.resolve(member)).resolves.toBeUndefined();
		await expect(Promise.resolve(guild)).resolves.toBeUndefined();
		expect(channelGet).not.toHaveBeenCalled();
		expect(memberGet).toHaveBeenCalledWith('member', 'guild');
		expect(guildGet).toHaveBeenCalledWith('guild');
	});

	test('maps flow and rest modes to the same fetch contract', async () => {
		const { channelFetch, context, guildFetch, memberFetch } = createContext(false);
		const query = { with_counts: true };

		await context.channel('channel', 'flow');
		await context.channel('channel', 'rest');
		await context.member('guild', 'member', 'rest');
		await context.guild('guild', 'rest', query);

		expect(channelFetch).toHaveBeenNthCalledWith(1, 'channel', false);
		expect(channelFetch).toHaveBeenNthCalledWith(2, 'channel', true);
		expect(memberFetch).toHaveBeenCalledWith('guild', 'member', true);
		expect(guildFetch).toHaveBeenCalledWith('guild', { force: true, query });
	});

	test('returns absence outside guilds without consulting member or guild resources', async () => {
		const { context, guildFetch, guildGet, memberFetch, memberGet } = createContext(true);

		await expect(context.member(undefined, 'member', 'cache')).resolves.toBeUndefined();
		await expect(context.guild(undefined, 'flow')).resolves.toBeUndefined();
		expect(memberGet).not.toHaveBeenCalled();
		expect(memberFetch).not.toHaveBeenCalled();
		expect(guildGet).not.toHaveBeenCalled();
		expect(guildFetch).not.toHaveBeenCalled();
	});
});
