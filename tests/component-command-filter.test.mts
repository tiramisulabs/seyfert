import { describe, expect, test } from 'vitest';
import { ComponentCommand } from '../src/components/componentcommand';
import { ModalCommand } from '../src/components/modalcommand';

class ButtonCommand extends ComponentCommand {
	componentType = 'Button' as const;
	run() {}
}

class FormCommand extends ModalCommand {
	run() {}
}

function createCommands() {
	return [new ButtonCommand(), new FormCommand()];
}

describe('component and modal command custom ID filters', () => {
	test.each(['g', 'y'])('matches stateful regular expressions with the %s flag repeatedly', flag => {
		const context = { customId: 'confirm' } as never;

		for (const command of createCommands()) {
			const customId = new RegExp('^confirm$', flag);
			customId.lastIndex = 3;
			command.customId = customId;

			expect(command._filter(context)).toBe(true);
			expect(command._filter(context)).toBe(true);
			expect(customId.lastIndex).toBe(3);
		}
	});

	test('matches frozen non-stateful regular expressions', () => {
		const context = { customId: 'confirm' } as never;

		for (const command of createCommands()) {
			command.customId = Object.freeze(/^confirm$/);

			expect(command._filter(context)).toBe(true);
			expect(command._filter(context)).toBe(true);
		}
	});
});
