import { describe, expect, test, vi } from 'vitest';
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

describe('component collectors', () => {
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
