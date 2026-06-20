import { describe, expect, test, vi } from 'vitest';
import { Command, SubCommand } from '../src/commands';
import { CommandHandler } from '../src/commands/handler';

function createCommandHandler() {
	const warn = vi.fn();
	const logger = { warn, error: vi.fn() };
	const client = { langs: { values: {} }, options: {} };
	const handler = new CommandHandler(logger as never, client as never);
	return { handler, warn };
}

class Sub extends SubCommand {
	constructor(
		public name: string,
		public group?: string,
	) {
		super();
	}
	description = '';
	run() {}
}

function makeCommand(subs: SubCommand[]) {
	const command = new (class extends Command {
		name = 'parent';
		description = '';
	})();
	command.options = subs;
	return command;
}

describe('CommandHandler subcommand limit diagnostics', () => {
	test('warns when a command has more than 25 subcommands', () => {
		const { handler, warn } = createCommandHandler();
		const subs = Array.from({ length: 26 }, (_, i) => new Sub(`sub${i}`));

		handler.checkSubCommandsLimit(makeCommand(subs));

		expect(warn).toHaveBeenCalledTimes(1);
		expect(warn.mock.calls[0][0]).toContain('26 subcommands');
	});

	test('does not warn at exactly 25 subcommands', () => {
		const { handler, warn } = createCommandHandler();
		const subs = Array.from({ length: 25 }, (_, i) => new Sub(`sub${i}`));

		handler.checkSubCommandsLimit(makeCommand(subs));

		expect(warn).not.toHaveBeenCalled();
	});

	test('counts subcommands per group, not in total', () => {
		const { handler, warn } = createCommandHandler();
		const subs = [
			...Array.from({ length: 20 }, (_, i) => new Sub(`a${i}`, 'g1')),
			...Array.from({ length: 20 }, (_, i) => new Sub(`b${i}`, 'g2')),
		];

		handler.checkSubCommandsLimit(makeCommand(subs));

		expect(warn).not.toHaveBeenCalled();
	});

	test('warns naming the offending group', () => {
		const { handler, warn } = createCommandHandler();
		const subs = Array.from({ length: 26 }, (_, i) => new Sub(`a${i}`, 'g1'));

		handler.checkSubCommandsLimit(makeCommand(subs));

		expect(warn).toHaveBeenCalledTimes(1);
		expect(warn.mock.calls[0][0]).toContain('group "g1"');
	});
});
