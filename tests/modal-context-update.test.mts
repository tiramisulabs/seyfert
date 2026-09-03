import { createMockBot } from '@slipher/testing';
import { describe, expect, test } from 'vitest';
import {
	Command,
	type CommandContext,
	Declare,
	Label,
	Modal,
	ModalCommand,
	type ModalContext,
	TextInput,
	TextInputStyle,
} from '../lib';

@Declare({ name: 'open-update', description: 'Open an update modal' })
class OpenUpdateModal extends Command {
	async run(ctx: CommandContext) {
		await ctx.modal(
			new Modal()
				.setCustomId('update-modal')
				.setTitle('Update')
				.addComponents(
					new Label().setLabel('Mode').setComponent(new TextInput().setCustomId('mode').setStyle(TextInputStyle.Short)),
				),
		);
	}
}

class UpdateModal extends ModalCommand {
	customId = 'update-modal';

	async run(ctx: ModalContext) {
		if (ctx.getInputValue('mode', true) === 'defer') {
			await ctx.deferUpdate();
			return;
		}
		await ctx.update({ content: 'updated' }, true);
	}
}

describe('ModalContext update proxies', () => {
	test('proxies update to the modal submit interaction', async () => {
		await using bot = await createMockBot({ commands: [OpenUpdateModal], components: [UpdateModal] });

		await bot.slash({ name: 'open-update' });
		const result = await bot.submitModal('update-modal', { mode: 'update' });

		expect(result.content).toBe('updated');
	});

	test('proxies deferUpdate without arguments', async () => {
		await using bot = await createMockBot({ commands: [OpenUpdateModal], components: [UpdateModal] });

		await bot.slash({ name: 'open-update' });
		const result = await bot.submitModal('update-modal', { mode: 'defer' });

		expect(result.deferredUpdate).toBe(true);
	});
});
