import { createMockBot, rendered } from '@slipher/testing';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { ActionRow, Button, ButtonStyle, Command, type CommandContext, Declare } from '../lib';
import { ComponentHandler } from '../src/components/handler';
import type { ModalSubmitInteraction } from '../src/structures/Interaction';

function createHandler() {
	const logger = {
		error: vi.fn(),
		fatal: vi.fn(),
		warn: vi.fn(),
	};
	const client = {
		logger,
		options: {},
	};
	return new ComponentHandler(logger as never, client as never);
}

function createInteraction(customId: string) {
	return { customId } as never;
}

function createModalInteraction(customId: string, userId = 'same-user'): ModalSubmitInteraction {
	const data = { customId };
	return {
		data,
		get customId() {
			return data.customId;
		},
		user: { id: userId },
	} as never;
}

function createCollectorFixture(registerAfterTimeout = false) {
	let waitResult: Promise<unknown | null> | undefined;
	let handlerRegistration: Promise<void> | undefined;

	class CollectorCommand extends Command {
		async run(ctx: CommandContext) {
			await ctx.write({
				content: 'ready',
				components: [
					new ActionRow<Button>().addComponents(
						new Button().setCustomId('keep').setLabel('Keep').setStyle(ButtonStyle.Secondary),
						new Button().setCustomId('confirm').setLabel('Confirm').setStyle(ButtonStyle.Primary),
					),
				],
			});
			const message = await ctx.fetchResponse();
			const collector = message.createComponentCollector();
			collector.run('keep', interaction => interaction.write({ content: 'kept' }));
			waitResult = collector.waitFor('confirm', 100);
			if (registerAfterTimeout) {
				handlerRegistration = waitResult.then(() => {
					collector.run('confirm', interaction => interaction.write({ content: 'late handler' }));
				});
			}
		}
	}

	return {
		command: Declare({ name: 'collect', description: 'Open component collectors' })(CollectorCommand),
		result() {
			if (!waitResult) throw new Error('Collector command has not started.');
			return waitResult;
		},
		waitForHandlerRegistration() {
			if (!handlerRegistration) throw new Error('Late handler registration was not requested.');
			return handlerRegistration;
		},
	};
}

async function createCollectorBot({ registerAfterTimeout = false }: { registerAfterTimeout?: boolean } = {}) {
	vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
	const fixture = createCollectorFixture(registerAfterTimeout);
	const bot = await createMockBot({
		commands: [fixture.command],
		timers: {
			advance(milliseconds) {
				vi.advanceTimersByTime(milliseconds);
			},
		},
	});
	return { bot, fixture };
}

describe('component collectors', () => {
	afterEach(() => {
		vi.useRealTimers();
		vi.restoreAllMocks();
	});

	test('removes a waitFor entry after it times out without removing sibling handlers', async () => {
		const { bot: collectorBot, fixture } = await createCollectorBot();
		await using bot = collectorBot;
		const opened = await bot.slash({ name: 'collect' });
		const source = bot.lastSentMessage()?.id;
		if (!source) throw new Error('Collector command did not render a source message.');

		await bot.advanceTime(100);

		await expect(fixture.result()).resolves.toBeNull();
		rendered(opened).get.button('keep');
		await expect(bot.clickButton('keep', { source })).resolves.toMatchObject({ content: 'kept' });
		await expect(bot.clickButton('confirm', { source })).rejects.toThrow(/no component/i);
	});

	test('leaves run entries active when registered after waitFor times out for the same custom id', async () => {
		const { bot: collectorBot, fixture } = await createCollectorBot({ registerAfterTimeout: true });
		await using bot = collectorBot;
		const opened = await bot.slash({ name: 'collect' });
		const source = bot.lastSentMessage()?.id;
		if (!source) throw new Error('Collector command did not render a source message.');

		await bot.advanceTime(100);
		await expect(fixture.result()).resolves.toBeNull();
		await fixture.waitForHandlerRegistration();

		rendered(opened).get.button('confirm');
		await expect(bot.clickButton('confirm', { source })).resolves.toMatchObject({ content: 'late handler' });
	});

	test('removes a waitFor entry after it resolves successfully', async () => {
		const { bot: collectorBot, fixture } = await createCollectorBot();
		await using bot = collectorBot;
		const opened = await bot.slash({ name: 'collect' });
		const source = bot.lastSentMessage()?.id;
		if (!source) throw new Error('Collector command did not render a source message.');

		rendered(opened).get.button('confirm');
		await bot.clickButton('confirm', { source });

		await expect(fixture.result()).resolves.not.toBeNull();
		await expect(bot.clickButton('confirm', { source })).rejects.toThrow(/no component/i);
		expect(vi.getTimerCount()).toBe(0);
	});

	test('settles pending waiters when the collector stops', async () => {
		const handler = createHandler();
		const collector = handler.createComponentCollector('message-id', 'channel-id', undefined);
		const waiting = collector.waitFor('confirm', 1_000);

		collector.stop('done');

		await expect(waiting).resolves.toBeNull();
		expect(handler.values.has('message-id')).toBe(false);
	});

	test('does not carry pending waiters into a restarted collector', async () => {
		const handler = createHandler();
		let restart: (() => void) | undefined;
		const collector = handler.createComponentCollector('message-id', 'channel-id', undefined, {
			onStop: (_reason, restartCollector) => {
				restart = restartCollector;
			},
		});
		const persistent = vi.fn();
		collector.run('keep', persistent);
		const waiting = collector.waitFor('confirm');

		collector.stop('restart');
		restart?.();

		await expect(waiting).resolves.toBeNull();
		expect(handler.hasComponent('message-id', 'confirm')).toBe(false);
		expect(handler.hasComponent('message-id', 'keep')).toBe(true);
		await handler.onComponent('message-id', createInteraction('keep'));
		expect(persistent).toHaveBeenCalledTimes(1);
	});

	test('routes simultaneous modal callbacks by wire custom id instead of user id', async () => {
		const handler = createHandler();
		const firstCallback = vi.fn();
		const secondCallback = vi.fn();
		const firstInteraction = createModalInteraction('profile:first');
		const secondInteraction = createModalInteraction('profile:second');
		handler.registerModal('profile:first', 'profile', firstCallback);
		handler.registerModal('profile:second', 'profile', secondCallback);

		handler.onModalSubmit(secondInteraction);
		handler.onModalSubmit(firstInteraction);

		expect(firstCallback).toHaveBeenCalledWith(expect.objectContaining({ customId: 'profile' }));
		expect(secondCallback).toHaveBeenCalledWith(expect.objectContaining({ customId: 'profile' }));
	});

	test('retains a timed-out modal alias for ModalCommand fallback', () => {
		const handler = createHandler();
		const interaction = createModalInteraction('profile:late', 'user');
		handler.registerModal('profile:late', 'profile', vi.fn());
		handler.deleteModalCallback('profile:late');

		expect(handler.hasModal(interaction)).toBe(false);
		handler.restoreModalCustomId(interaction);

		expect(interaction.customId).toBe('profile');
	});

	test.each(['g', 'y'])('matches stateful regular expressions with the %s flag repeatedly', async flag => {
		const handler = createHandler();
		const collector = handler.createComponentCollector('message-id', 'channel-id', undefined);
		const onRun = vi.fn();
		const customId = new RegExp('^confirm$', flag);
		customId.lastIndex = 3;
		collector.run(customId, onRun);
		const interaction = createInteraction('confirm');

		for (let index = 0; index < 2; index++) {
			expect(handler.hasComponent('message-id', 'confirm')).toBe(true);
			await handler.onComponent('message-id', interaction);
		}

		expect(onRun).toHaveBeenCalledTimes(2);
		expect(customId.lastIndex).toBe(3);
	});

	test('matches frozen non-stateful regular expressions repeatedly', async () => {
		const handler = createHandler();
		const collector = handler.createComponentCollector('message-id', 'channel-id', undefined);
		const onRun = vi.fn();
		collector.run(Object.freeze(/^confirm$/), onRun);
		const interaction = createInteraction('confirm');

		for (let index = 0; index < 2; index++) {
			expect(handler.hasComponent('message-id', 'confirm')).toBe(true);
			await handler.onComponent('message-id', interaction);
		}

		expect(onRun).toHaveBeenCalledTimes(2);
	});
});
