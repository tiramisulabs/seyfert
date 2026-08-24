import { createMockBot } from '@slipher/testing';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import {
	Command,
	ComponentCommand,
	Declare,
	Label,
	Modal,
	ModalCommand,
	TextInput,
	TextInputStyle,
	type CommandContext,
} from '../lib';

const componentRunError = vi.fn();
const componentInternalError = vi.fn();
const componentRun = vi.fn();
const modalRunError = vi.fn();
const modalInternalError = vi.fn();
const modalRun = vi.fn();

class FailingBeforeMiddlewaresComponent extends ComponentCommand {
	componentType = 'Button' as const;
	customId = 'component-internal-error';
	onBeforeMiddlewares = vi.fn(() => {
		throw new Error('component infrastructure failure');
	});
	onRunError = componentRunError;
	onInternalError = componentInternalError;
	run = componentRun;
}

class FailingBeforeMiddlewaresModal extends ModalCommand {
	customId = 'modal-internal-error';
	onBeforeMiddlewares = vi.fn(() => {
		throw new Error('modal infrastructure failure');
	});
	onRunError = modalRunError;
	onInternalError = modalInternalError;
	run = modalRun;
}

@Declare({ name: 'open-failing-modal', description: 'Open the failing modal' })
class OpenFailingModal extends Command {
	async run(ctx: CommandContext) {
		await ctx.modal(
			new Modal()
				.setCustomId('modal-internal-error')
				.setTitle('Failure')
				.addComponents(
					new Label()
						.setLabel('Value')
						.setComponent(new TextInput().setCustomId('value').setStyle(TextInputStyle.Short)),
				),
		);
	}
}

describe('component command internal errors', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	test('passes the component command instance before the error', async () => {
		await using bot = await createMockBot({ components: [FailingBeforeMiddlewaresComponent] });

		await bot.clickButton('component-internal-error', { allowSyntheticSource: true });

		expect(componentRunError).not.toHaveBeenCalled();
		expect(componentRun).not.toHaveBeenCalled();
		expect(componentInternalError).toHaveBeenCalledTimes(1);
		expect(componentInternalError).toHaveBeenCalledWith(
			bot.client,
			expect.any(FailingBeforeMiddlewaresComponent),
			expect.objectContaining({ message: 'component infrastructure failure' }),
		);
	});

	test('passes the modal command instance before the error', async () => {
		await using bot = await createMockBot({
			commands: [OpenFailingModal],
			components: [FailingBeforeMiddlewaresModal],
		});
		await bot.slash({ name: 'open-failing-modal' });

		await bot.submitModal('modal-internal-error', { value: 'test' });

		expect(modalRunError).not.toHaveBeenCalled();
		expect(modalRun).not.toHaveBeenCalled();
		expect(modalInternalError).toHaveBeenCalledTimes(1);
		expect(modalInternalError).toHaveBeenCalledWith(
			bot.client,
			expect.any(FailingBeforeMiddlewaresModal),
			expect.objectContaining({ message: 'modal infrastructure failure' }),
		);
	});
});
