import { describe, expect, test, vi } from 'vitest';
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
	return {
		client,
		handler: new ComponentHandler(logger as never, client as never),
	};
}

class FailingBeforeMiddlewaresComponent extends ComponentCommand {
	componentType = 'Button' as const;
	customId = 'component-internal-error';
	onBeforeMiddlewares = vi.fn(() => {
		throw new Error('component infrastructure failure');
	});
	onRunError = vi.fn();
	onInternalError = vi.fn();
	run = vi.fn();
}

class FailingBeforeMiddlewaresModal extends ModalCommand {
	customId = 'modal-internal-error';
	onBeforeMiddlewares = vi.fn(() => {
		throw new Error('modal infrastructure failure');
	});
	onRunError = vi.fn();
	onInternalError = vi.fn();
	run = vi.fn();
}

describe('component command internal errors', () => {
	test('passes the component command instance before the error', async () => {
		const { client, handler } = createHandler();
		const command = new FailingBeforeMiddlewaresComponent();

		await handler.execute(command, { client } as never);

		expect(command.onRunError).not.toHaveBeenCalled();
		expect(command.run).not.toHaveBeenCalled();
		expect(command.onInternalError).toHaveBeenCalledTimes(1);
		expect(command.onInternalError).toHaveBeenCalledWith(client, command, expect.any(Error));
		expect(command.onInternalError.mock.calls[0][2]).toMatchObject({ message: 'component infrastructure failure' });
	});

	test('passes the modal command instance before the error', async () => {
		const { client, handler } = createHandler();
		const command = new FailingBeforeMiddlewaresModal();

		await handler.execute(command, { client } as never);

		expect(command.onRunError).not.toHaveBeenCalled();
		expect(command.run).not.toHaveBeenCalled();
		expect(command.onInternalError).toHaveBeenCalledTimes(1);
		expect(command.onInternalError).toHaveBeenCalledWith(client, command, expect.any(Error));
		expect(command.onInternalError.mock.calls[0][2]).toMatchObject({ message: 'modal infrastructure failure' });
	});
});
