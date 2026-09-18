import { createMockBot } from '@slipher/testing';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { Command, type CommandContext, createMiddleware, Declare, Middlewares, Options, SubCommand } from '../lib';

const calls: string[] = [];
const middlewares = {
	parent: createMiddleware<void>(({ next }) => {
		calls.push('parent');
		next();
	}),
	shared: createMiddleware<void>(({ next }) => {
		calls.push('shared');
		next();
	}),
	child: createMiddleware<void>(({ next }) => {
		calls.push('child');
		next();
	}),
};

@Declare({ name: 'child', description: 'Child command' })
@Middlewares(['shared', 'child'] as never)
class ChildCommand extends SubCommand {
	run(context: CommandContext) {
		return context.write({ content: 'ran child' });
	}
}

@Declare({ name: 'parent', description: 'Parent command' })
@Middlewares(['parent', 'shared'] as never)
@Options([ChildCommand])
class ParentCommand extends Command {}

describe('subcommand middleware dispatch', () => {
	beforeEach(() => {
		calls.length = 0;
		vi.clearAllMocks();
	});

	test('runs inherited parent and child middlewares once for slash commands', async () => {
		await using bot = await createMockBot({ commands: [ParentCommand], middlewares: middlewares as never });

		const result = await bot.slash({ name: 'parent', subcommand: 'child' });

		expect(result.content).toBe('ran child');
		expect(calls).toEqual(['parent', 'shared', 'child']);
	});

	test('runs inherited parent and child middlewares once for text commands', async () => {
		await using bot = await createMockBot({
			commands: [ParentCommand],
			middlewares: middlewares as never,
			prefixes: ['!'],
		});

		const result = await bot.say('!parent child');

		expect(result.content).toBe('ran child');
		expect(calls).toEqual(['parent', 'shared', 'child']);
	});
});
