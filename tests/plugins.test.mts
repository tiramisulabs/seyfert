import { assert, describe, test } from 'vitest';
import { BaseClient, type BaseClientOptions } from '../lib/client/base';
import {
	resolveClientPlugins,
	setupClientPlugins,
	teardownClientPlugins,
	type SeyfertPlugin,
	type SeyfertPluginClient,
} from '../lib/client/plugins';
import { Command, SubCommand } from '../lib/commands';
import { HandleCommand } from '../lib/commands/handle';

function createRuntimeConfig() {
	return {
		locations: {
			base: '',
		},
		token: Buffer.from('bot').toString('base64'),
		intents: 0,
	};
}

describe('client plugins', () => {
	test('plugin command defaults do not also run the built-in fallback', async () => {
		const calls: string[] = [];
		const plugin: SeyfertPlugin = {
			name: 'test-plugin',
			options: () => ({
				commands: {
					defaults: {
						onRunError: () => calls.push('plugin'),
					},
				},
			}),
		};

		const resolved = resolveClientPlugins(
			{
				commands: {
					defaults: {
						onRunError: () => calls.push('fallback'),
					},
				},
			},
			{ plugins: [plugin] },
		);

		await resolved.options.commands?.defaults?.onRunError?.({} as never, new Error('boom'));

		assert.deepEqual(calls, ['plugin']);
	});

	test('command error defaults compose plugin and user hooks without built-in fallback', async () => {
		const commandErrorHooks = [
			'onRunError',
			'onMiddlewaresError',
			'onOptionsError',
			'onPermissionsFail',
			'onBotPermissionsFail',
			'onInternalError',
		] as const satisfies readonly (keyof NonNullable<NonNullable<BaseClientOptions['commands']>['defaults']>)[];

		for (const hook of commandErrorHooks) {
			const calls: string[] = [];
			const plugin: SeyfertPlugin = {
				name: `test-plugin-${hook}`,
				options: () => ({
					commands: {
						defaults: {
							[hook]: () => calls.push('plugin'),
						},
					},
				}),
			};

			const resolved = resolveClientPlugins(
				{
					commands: {
						defaults: {
							[hook]: () => calls.push('fallback'),
						},
					},
				},
				{
					plugins: [plugin],
					commands: {
						defaults: {
							[hook]: () => calls.push('user'),
						},
					},
				},
			);

			await (resolved.options.commands?.defaults?.[hook] as (...args: unknown[]) => unknown)?.(
				{} as never,
				new Error('boom'),
			);

			assert.deepEqual(calls, ['plugin', 'user'], hook);
		}
	});

	test('plugin teardown runs in LIFO order and collects errors', async () => {
		const calls: string[] = [];
		const firstError = new Error('first failed');
		const plugins: SeyfertPlugin[] = [
			{
				name: 'first',
				teardown: () => {
					calls.push('first');
					throw firstError;
				},
			},
			{
				name: 'second',
				teardown: () => {
					calls.push('second');
				},
			},
			{
				name: 'third',
				teardown: () => {
					calls.push('third');
					throw new Error('third failed');
				},
			},
		];

		let thrown: AggregateError | undefined;
		try {
			await teardownClientPlugins({ plugins } as SeyfertPluginClient, plugins);
		} catch (error) {
			thrown = error as AggregateError;
		}

		assert.instanceOf(thrown, AggregateError);
		assert.equal(thrown.errors.length, 2);
		assert.equal(thrown.errors[0].message, 'third failed');
		assert.equal(thrown.errors[1], firstError);

		assert.deepEqual(calls, ['third', 'second', 'first']);
	});

	test('client stop is idempotent and flips initialized before teardown', async () => {
		const states: boolean[] = [];
		let teardownCalls = 0;
		const plugin: SeyfertPlugin = {
			name: 'lifecycle',
			teardown: client => {
				teardownCalls++;
				states.push(client.initialized);
			},
		};
		const client = new BaseClient({
			getRC: createRuntimeConfig,
			plugins: [plugin],
		});

		await client.start();

		assert.equal(client.initialized, true);

		await client.stop();
		await client.stop();

		assert.equal(client.initialized, false);
		assert.equal(teardownCalls, 1);
		assert.deepEqual(states, [false]);
	});

	test('setup receives initialized=false and start flips initialized after setup', async () => {
		const states: boolean[] = [];
		const plugin: SeyfertPlugin = {
			name: 'setup-state',
			setup: client => states.push(client.initialized),
		};
		const client = new BaseClient({
			getRC: createRuntimeConfig,
			plugins: [plugin],
		});

		await client.start();

		assert.deepEqual(states, [false]);
		assert.equal(client.initialized, true);

		await client.stop();
	});
});

describe('handle command resolution', () => {
	test('resolves chat commands by full name without a fake message', () => {
		const client = new BaseClient({
			getRC: createRuntimeConfig,
		});

		const parent = new Command();
		parent.name = 'audio';
		parent.description = 'Audio tools';
		parent.contexts = [];
		parent.integrationTypes = [];

		const transcode = new TranscodeCommand();
		transcode.name = 'transcode';
		transcode.description = 'Transcode audio';
		transcode.contexts = [];
		transcode.integrationTypes = [];
		transcode.group = 'tools';
		parent.groups = {
			tools: {
				defaultDescription: 'Tools',
			},
		};
		parent.options = [transcode];
		parent.guildId = ['guild-1'];
		client.commands.values.push(parent);
		client.handleCommand = new HandleCommand(client as never);

		assert.equal(client.handleCommand.resolveByName('audio tools transcode', 'guild-1')?.command, transcode);
		assert.equal(client.handleCommand.resolveByName('audio', 'guild-1')?.command, parent);
		assert.equal(client.handleCommand.resolveByName('audio tools unknown', 'guild-1'), undefined);
		assert.equal(client.handleCommand.resolveByName('audio unknown', 'guild-1'), undefined);
		assert.equal(client.handleCommand.resolveByName('audio tools transcode', 'guild-2'), undefined);
		assert.equal(client.handleCommand.resolveByName('audio tools transcode'), undefined);
	});
});

class TranscodeCommand extends SubCommand {
	run() {}
}
