import { createMockBot } from '@slipher/testing';
import { describe, expect, test, vi } from 'vitest';
import { Command, Declare, Label, Modal, TextInput, TextInputStyle, type CommandContext } from '../lib';

function profileModal() {
	return new Modal()
		.setCustomId('profile')
		.setTitle('Profile')
		.addComponents(
			new Label()
				.setLabel('Name')
				.setComponent(new TextInput().setCustomId('name').setStyle(TextInputStyle.Short)),
		);
}

@Declare({ name: 'open-profile', description: 'Open the profile modal' })
class OpenProfileCommand extends Command {
	async run(ctx: CommandContext) {
		await ctx.modal(profileModal());
	}
}

@Declare({ name: 'await-profile', description: 'Wait for the profile modal' })
class AwaitProfileCommand extends Command {
	async run(ctx: CommandContext) {
		const submitted = await ctx.modal(profileModal(), { waitFor: 1_000 });
		if (submitted) {
			const name = submitted.getInputValue('name', true);
			await submitted.write({ content: Array.isArray(name) ? name.join(',') : name });
		}
	}
}

describe('CommandContext.modal', () => {
	test('opens and awaits modal submissions through interaction contexts', async () => {
		await using bot = await createMockBot({ commands: [OpenProfileCommand, AwaitProfileCommand] });

		const opened = await bot.slash({ name: 'open-profile' });
		expect(opened.modal).toEqual({ customId: 'profile', title: 'Profile' });

		await bot.slash({ name: 'await-profile' });
		const submitted = await bot.submitModal('profile', { name: 'socram' });
		expect(submitted.content).toBe('socram');
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
