import { createMockBot } from '@slipher/testing';
import { describe, expect, test, vi } from 'vitest';
import { Command, type CommandContext, Declare, Label, Modal, TextInput, TextInputStyle } from '../lib';

function profileModal() {
	return new Modal()
		.setCustomId('profile')
		.setTitle('Profile')
		.addComponents(
			new Label().setLabel('Name').setComponent(new TextInput().setCustomId('name').setStyle(TextInputStyle.Short)),
		);
}

@Declare({ name: 'open-profile', description: 'Open the profile modal' })
class OpenProfileCommand extends Command {
	async run(ctx: CommandContext) {
		await ctx.modal(profileModal());
	}
}

describe('CommandContext.modal', () => {
	test('preserves the public custom id for modals without a waiter', async () => {
		await using bot = await createMockBot({ commands: [OpenProfileCommand] });
		const opened = await bot.slash({ name: 'open-profile' });
		expect(opened.modal).toEqual({ customId: 'profile', title: 'Profile' });
	});

	test('reports a clear error for prefix command contexts', async () => {
		const onRunError = vi.fn();
		class ObservedOpenProfileCommand extends OpenProfileCommand {
			onRunError(_ctx: CommandContext, error: unknown) {
				onRunError(error);
			}
		}
		await using bot = await createMockBot({ commands: [ObservedOpenProfileCommand], prefixes: ['!'] });

		await bot.say('!open-profile');

		expect(onRunError).toHaveBeenCalledWith(
			expect.objectContaining({ message: 'Cannot use modal without an interaction.' }),
		);
	});
});
