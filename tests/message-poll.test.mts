import { apiPoll, createMockBot, mockWorld, Routes } from '@slipher/testing';
import { describe, expect, test } from 'vitest';

function pollWorld() {
	const world = mockWorld();
	const guild = world.registerGuild();
	const channel = world.registerChannel(guild.id);
	const voter = world.registerUser({ username: 'alice' });
	const message = world.registerMessage(channel.id, {
		content: 'poll',
		poll: apiPoll({
			question: 'Pick one',
			answers: ['One', 'Two'],
			expiry: '2026-01-02T00:00:00.000Z',
		}),
	});
	return { channel, message, voter, world };
}

describe('Message poll helpers', () => {
	test('endPoll delegates through REST and returns the finalized message', async () => {
		const { channel, message, world } = pollWorld();
		await using bot = await createMockBot({ world });
		const structure = await bot.client.messages.fetch(message.id, channel.id);

		const ended = await structure.endPoll();

		expect(ended.id).toBe(message.id);
		expect(ended.poll?.results?.isFinalized).toBe(true);
		expect(bot.restCalls(Routes.endPoll)).toContainEqual(
			expect.objectContaining({ params: { channelId: channel.id, messageId: message.id } }),
		);
	});

	test('getAnswerVoters validates known answers before calling REST', async () => {
		const { channel, message, voter, world } = pollWorld();
		await using bot = await createMockBot({ world });
		bot.seedPollVote(channel.id, message.id, 1, voter.id);
		const structure = await bot.client.messages.fetch(message.id, channel.id);

		await expect(structure.getAnswerVoters(1, true)).resolves.toEqual([expect.objectContaining({ id: voter.id })]);
		expect(bot.restCalls(Routes.getPollAnswerVoters)).toHaveLength(1);

		await expect(structure.getAnswerVoters(3, true)).rejects.toMatchObject({ code: 'INVALID_ANSWER_ID' });
		expect(bot.restCalls(Routes.getPollAnswerVoters)).toHaveLength(1);
	});

	test('getAnswerVoters delegates when local answer validation is not possible', async () => {
		const world = mockWorld();
		const guild = world.registerGuild();
		const channel = world.registerChannel(guild.id);
		const voter = world.registerUser({ username: 'alice' });
		const message = world.registerMessage(channel.id, { content: 'poll omitted locally' });
		await using bot = await createMockBot({ world });
		bot.rest.intercept(Routes.getPollAnswerVoters, () => ({ users: [voter] }));
		const structure = await bot.client.messages.fetch(message.id, channel.id);

		await expect(structure.getAnswerVoters(3, true)).resolves.toEqual([expect.objectContaining({ id: voter.id })]);
		expect(bot.restCalls(Routes.getPollAnswerVoters)).toContainEqual(
			expect.objectContaining({
				params: { channelId: channel.id, messageId: message.id, answerId: '3' },
			}),
		);
	});
});
