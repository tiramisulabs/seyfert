import { createMockBot, rendered } from '@slipher/testing';
import { afterEach, describe, expect, test, vi } from 'vitest';
import {
	ActionRow,
	Button,
	ButtonStyle,
	Command,
	Declare,
	type CommandContext,
} from '../lib';
import { ComponentHandler } from '../src/components/handler';

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

async function createCollectorBot(
	{ registerAfterTimeout = false }: { registerAfterTimeout?: boolean } = {},
) {
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
