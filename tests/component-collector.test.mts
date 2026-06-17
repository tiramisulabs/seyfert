import { afterEach, describe, expect, test, vi } from 'vitest';
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
	afterEach(() => {
		vi.useRealTimers();
		vi.restoreAllMocks();
	});

	test('removes a waitFor entry after it times out', async () => {
		vi.useFakeTimers();
		const handler = createHandler();
		const collector = handler.createComponentCollector('message-id', 'channel-id', undefined);
		collector.run('keep', vi.fn());

		const result = collector.waitFor('confirm', 100);

		await vi.advanceTimersByTimeAsync(100);

		await expect(result).resolves.toBeNull();
		expect(handler.hasComponent('message-id', 'confirm')).toBe(false);
		expect(handler.hasComponent('message-id', 'keep')).toBe(true);
		expect(handler.values.get('message-id')?.components).toHaveLength(1);
	});

	test('leaves run entries active after waitFor times out for the same custom id', async () => {
		vi.useFakeTimers();
		const handler = createHandler();
		const collector = handler.createComponentCollector('message-id', 'channel-id', undefined);
		const onRun = vi.fn();

		const result = collector.waitFor('confirm', 100);

		await vi.advanceTimersByTimeAsync(100);
		await expect(result).resolves.toBeNull();

		collector.run('confirm', onRun);
		const interaction = createInteraction('confirm');
		await handler.onComponent('message-id', interaction);

		expect(onRun).toHaveBeenCalledTimes(1);
		expect(onRun).toHaveBeenCalledWith(interaction, expect.any(Function), expect.any(Function));
	});

	test('removes a waitFor entry after it resolves successfully', async () => {
		vi.useFakeTimers();
		const handler = createHandler();
		const collector = handler.createComponentCollector('message-id', 'channel-id', undefined);
		const interaction = createInteraction('confirm');

		const result = collector.waitFor('confirm', 100);

		await handler.onComponent('message-id', interaction);

		await expect(result).resolves.toBe(interaction);
		expect(handler.hasComponent('message-id', 'confirm')).toBe(false);
		expect(vi.getTimerCount()).toBe(0);
	});
});
