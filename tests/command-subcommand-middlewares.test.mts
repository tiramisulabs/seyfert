import { describe, expect, test, vi } from 'vitest';
import { Command, SubCommand } from '../src/commands';
import { CommandHandler } from '../src/commands/handler';

function createCommandHandler() {
	const logger = { warn: vi.fn(), error: vi.fn() };
	const client = { langs: { values: {} }, options: {} };
	return new CommandHandler(logger as never, client as never);
}

class ChildCommand extends SubCommand {
	name = 'child';
	description = '';
	middlewares = ['shared', 'child'] as never;
	run() {}
}

class ParentCommand extends Command {
	name = 'parent';
	description = '';
	middlewares = ['parent', 'shared'] as never;
	options = [new ChildCommand()];
}

describe('CommandHandler subcommand middlewares', () => {
	test('inherits parent middlewares without executing duplicate names', () => {
		const handler = createCommandHandler();
		const [command] = handler.set([ParentCommand]);
		const subcommand = (command as Command).options![0] as SubCommand;

		expect(subcommand.middlewares).toEqual(['parent', 'shared', 'child']);
	});

	test('keeps inherited middleware resolution idempotent', () => {
		const handler = createCommandHandler();
		const [command] = handler.set([ParentCommand]);

		handler.set([command]);
		const subcommand = (command as Command).options![0] as SubCommand;

		expect(subcommand.middlewares).toEqual(['parent', 'shared', 'child']);
	});

	test('keeps each middleware name once across parent and child declarations', () => {
		const handler = createCommandHandler();
		const command = new ParentCommand();
		command.middlewares = ['parent', 'parent', 'shared'] as never;
		command.options![0]!.middlewares = ['shared', 'shared', 'child', 'child'] as never;

		const [loaded] = handler.set([command]);
		const subcommand = (loaded as Command).options![0] as SubCommand;

		expect(subcommand.middlewares).toEqual(['parent', 'shared', 'child']);
	});
});
