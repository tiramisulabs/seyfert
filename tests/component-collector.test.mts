import { createMockBot } from '@slipher/testing';
import { afterEach, describe, expect, test, vi } from 'vitest';
import {
	ActionRow,
	Button,
	ButtonStyle,
	Command,
	Declare,
	type CommandContext,
} from '../lib';

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
	});

	test('removes a waitFor entry after it times out without removing sibling handlers', async () => {
		const { bot: collectorBot, fixture } = await createCollectorBot();
		await using bot = collectorBot;
		const opened = await bot.slash({ name: 'collect' });

		await bot.advanceTime(100);

		await expect(fixture.result()).resolves.toBeNull();
		await expect(opened.component('keep')!.click()).resolves.toMatchObject({ content: 'kept' });
		await expect(opened.component('confirm')!.click()).rejects.toThrow(/no component/i);
	});

	test('leaves run entries active when registered after waitFor times out for the same custom id', async () => {
		const { bot: collectorBot, fixture } = await createCollectorBot({ registerAfterTimeout: true });
		await using bot = collectorBot;
		const opened = await bot.slash({ name: 'collect' });

		await bot.advanceTime(100);
		await expect(fixture.result()).resolves.toBeNull();
		await fixture.waitForHandlerRegistration();

		await expect(opened.component('confirm')!.click()).resolves.toMatchObject({ content: 'late handler' });
	});

	test('removes a waitFor entry after it resolves successfully', async () => {
		const { bot: collectorBot, fixture } = await createCollectorBot();
		await using bot = collectorBot;
		const opened = await bot.slash({ name: 'collect' });

		await opened.component('confirm')!.click();

		await expect(fixture.result()).resolves.not.toBeNull();
		await expect(opened.component('confirm')!.click()).rejects.toThrow(/no component/i);
		expect(vi.getTimerCount()).toBe(0);
	});
});
