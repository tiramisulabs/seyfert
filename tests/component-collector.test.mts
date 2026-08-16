import { afterEach, describe, expect, test, vi } from 'vitest';
import { ComponentCommand } from '../src/components/componentcommand';
import { ComponentHandler } from '../src/components/handler';
import { ModalCommand } from '../src/components/modalcommand';

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

	test('matches global regular expressions repeatedly in collectors', async () => {
		const handler = createHandler();
		const collector = handler.createComponentCollector('message-id', 'channel-id', undefined);
		const onRun = vi.fn();
		collector.run(/^confirm$/g, onRun);
		const interaction = createInteraction('confirm');

		expect(handler.hasComponent('message-id', 'confirm')).toBe(true);
		await handler.onComponent('message-id', interaction);
		await handler.onComponent('message-id', interaction);

		expect(onRun).toHaveBeenCalledTimes(2);
	});

	test('matches global regular expressions repeatedly in component and modal commands', () => {
		class ButtonCommand extends ComponentCommand {
			componentType = 'Button' as const;
			run() {}
		}

		class FormCommand extends ModalCommand {
			run() {}
		}

		const component = new ButtonCommand();
		component.customId = /^confirm$/g;
		const modal = new FormCommand();
		modal.customId = /^confirm$/g;
		const context = { customId: 'confirm' } as never;

		expect(component._filter(context)).toBe(true);
		expect(component._filter(context)).toBe(true);
		expect(modal._filter(context)).toBe(true);
		expect(modal._filter(context)).toBe(true);
	});
});
