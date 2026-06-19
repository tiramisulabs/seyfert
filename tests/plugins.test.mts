import { assert, describe, test } from 'vitest';
import { BaseClient, type BaseClientOptions } from '../lib/client/base';
import {
	resolveClientPlugins,
	SeyfertPluginAggregateError,
	SeyfertPluginError,
	setupClientPlugins,
	teardownClientPlugins,
	type SeyfertPlugin,
	type SeyfertPluginClient,
} from '../lib/client/plugins';
import { Command, SubCommand } from '../lib/commands';
import { HandleCommand } from '../lib/commands/handle';
import { SeyfertError } from '../lib/common';

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
	test('plugin command defaults run before the built-in fallback', async () => {
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

		assert.deepEqual(calls, ['plugin', 'fallback']);
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

	test('a plugin suppresses the framework default with api.commands.defaults({ suppressDefault })', async () => {
		const calls: string[] = [];
		const plugin: SeyfertPlugin = {
			name: 'suppressor',
			register(api) {
				api.commands.defaults({ onRunError: () => calls.push('plugin') }, { suppressDefault: true });
			},
		};

		const resolved = resolveClientPlugins(
			{ commands: { defaults: { onRunError: () => calls.push('fallback') } } },
			{ plugins: [plugin] },
		);

		await resolved.options.commands?.defaults?.onRunError?.({} as never, new Error('boom'));

		assert.deepEqual(calls, ['plugin']);
	});

	test('suppressDefault drops only the framework floor; an additive peer still runs', async () => {
		const calls: string[] = [];
		const additivePlugin: SeyfertPlugin = {
			name: 'additive',
			register(api) {
				api.commands.defaults({ onRunError: () => calls.push('additive') });
			},
		};
		const suppressor: SeyfertPlugin = {
			name: 'suppressor',
			register(api) {
				api.commands.defaults({ onRunError: () => calls.push('suppressor') }, { suppressDefault: true });
			},
		};

		const resolved = resolveClientPlugins(
			{ commands: { defaults: { onRunError: () => calls.push('fallback') } } },
			{ plugins: [additivePlugin, suppressor] },
		);

		await resolved.options.commands?.defaults?.onRunError?.({} as never, new Error('boom'));

		assert.deepEqual(calls, ['additive', 'suppressor']);
	});

	test('suppressDefault is ignored for a key the contribution does not actually handle', async () => {
		const calls: string[] = [];
		const plugin: SeyfertPlugin = {
			name: 'partial',
			register(api) {
				api.commands.defaults({ onRunError: () => calls.push('plugin') }, { suppressDefault: ['onMiddlewaresError'] });
			},
		};

		const resolved = resolveClientPlugins(
			{ commands: { defaults: { onRunError: () => calls.push('fallback') } } },
			{ plugins: [plugin] },
		);

		await resolved.options.commands?.defaults?.onRunError?.({} as never, new Error('boom'));

		assert.deepEqual(calls, ['plugin', 'fallback']);
	});

	test('api.commands.defaults composes props with user props last', () => {
		const plugin: SeyfertPlugin = {
			name: 'props',
			register(api) {
				api.commands.defaults({ props: { fromPlugin: true, winner: 'plugin' } });
			},
		};

		const resolved = resolveClientPlugins(
			{ commands: { defaults: { props: { fromDefault: true, winner: 'default' } } } },
			{ plugins: [plugin], commands: { defaults: { props: { fromUser: true, winner: 'user' } } } },
		);

		assert.deepEqual(resolved.options.commands?.defaults?.props, {
			fromDefault: true,
			fromPlugin: true,
			fromUser: true,
			winner: 'user',
		});
	});

	test('component and modal defaults compose plugin, user, and suppressed fallback hooks', async () => {
		const calls: string[] = [];
		const plugin: SeyfertPlugin = {
			name: 'component-modal-defaults',
			register(api) {
				api.components.defaults({ onRunError: () => calls.push('component-plugin') });
				api.modals.defaults({ onRunError: () => calls.push('modal-plugin') }, { suppressDefault: true });
			},
		};

		const resolved = resolveClientPlugins(
			{
				components: { defaults: { onRunError: () => calls.push('component-fallback') } },
				modals: { defaults: { onRunError: () => calls.push('modal-fallback') } },
			},
			{
				plugins: [plugin],
				components: { defaults: { onRunError: () => calls.push('component-user') } },
			},
		);

		await resolved.options.components?.defaults?.onRunError?.({} as never, new Error('boom'));
		await resolved.options.modals?.defaults?.onRunError?.({} as never, new Error('boom'));

		assert.deepEqual(calls, ['component-plugin', 'component-user', 'modal-plugin']);
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

		let thrown: SeyfertPluginAggregateError | undefined;
		try {
			await teardownClientPlugins({ plugins } as SeyfertPluginClient, plugins);
		} catch (error) {
			thrown = error as SeyfertPluginAggregateError;
		}

		assert.instanceOf(thrown, SeyfertPluginAggregateError);
		assert.instanceOf(thrown, SeyfertError);
		assert.equal(thrown.code, 'PLUGIN_TEARDOWN_FAILED');
		assert.deepEqual(thrown.metadata, { plugin: '<multiple>', phase: 'teardown', index: -1 });
		assert.equal(thrown.errors.length, 2);
		assert.instanceOf(thrown.errors[0], SeyfertPluginError);
		assert.match(thrown.errors[0].message, /third.*teardown|teardown.*third/);
		assert.equal(thrown.errors[0].cause.message, 'third failed');
		assert.instanceOf(thrown.errors[1], SeyfertPluginError);
		assert.match(thrown.errors[1].message, /first.*teardown|teardown.*first/);
		assert.equal(thrown.errors[1].cause, firstError);

		assert.deepEqual(calls, ['third', 'second', 'first']);
	});

	test('plugin setup rollback wraps setup and teardown failures in plugin aggregate errors', async () => {
		const calls: string[] = [];
		const setupError = new Error('setup failed');
		const teardownError = new Error('teardown failed');
		const plugins: SeyfertPlugin[] = [
			{
				name: 'first',
				setup: () => {
					calls.push('setup first');
				},
				teardown: () => {
					calls.push('teardown first');
					throw teardownError;
				},
			},
			{
				name: 'second',
				setup: () => {
					calls.push('setup second');
					throw setupError;
				},
			},
		];

		let thrown: SeyfertPluginAggregateError | undefined;
		try {
			await setupClientPlugins({ plugins } as SeyfertPluginClient, plugins);
		} catch (error) {
			thrown = error as SeyfertPluginAggregateError;
		}

		assert.instanceOf(thrown, SeyfertPluginAggregateError);
		assert.instanceOf(thrown, SeyfertError);
		assert.equal(thrown.code, 'PLUGIN_FAILED');
		assert.deepEqual(thrown.metadata, { plugin: '<multiple>', phase: 'setup', index: -1 });
		assert.equal(thrown.errors.length, 2);
		assert.instanceOf(thrown.errors[0], SeyfertPluginError);
		assert.match(thrown.errors[0].message, /second.*setup|setup.*second/);
		assert.equal(thrown.errors[0].cause, setupError);
		assert.instanceOf(thrown.errors[1], SeyfertPluginAggregateError);
		assert.equal(thrown.errors[1].cause, teardownError);
		assert.deepEqual(calls, ['setup first', 'setup second', 'teardown first']);
	});

	test('plugin setup failure tears down completed plugins in LIFO order', async () => {
		const calls: string[] = [];
		const setupError = new Error('setup failed');
		const plugins: SeyfertPlugin[] = [
			{
				name: 'first',
				setup: () => {
					calls.push('setup first');
				},
				teardown: () => {
					calls.push('teardown first');
				},
			},
			{
				name: 'second',
				setup: () => {
					calls.push('setup second');
				},
				teardown: () => {
					calls.push('teardown second');
				},
			},
			{
				name: 'third',
				setup: () => {
					calls.push('setup third');
					throw setupError;
				},
				teardown: () => {
					calls.push('teardown third');
				},
			},
		];

		let thrown: unknown;
		try {
			await setupClientPlugins({ plugins } as SeyfertPluginClient, plugins);
		} catch (error) {
			thrown = error;
		}

		assert.match((thrown as Error).message, /third.*setup|setup.*third/);
		assert.equal((thrown as Error).cause, setupError);
		assert.deepEqual(calls, ['setup first', 'setup second', 'setup third', 'teardown second', 'teardown first']);
	});

	test('plugin lifecycle does not expose mutable initialized state', async () => {
		const states: boolean[] = [];
		const plugin: SeyfertPlugin = {
			name: 'lifecycle',
			setup: client => states.push('initialized' in client),
			teardown: client => states.push('initialized' in client),
		};
		const client = new BaseClient({
			getRC: createRuntimeConfig,
			plugins: [plugin],
		});

		await client.start();
		await client.close();

		assert.deepEqual(states, [false, false]);
	});

	test('client close is idempotent', async () => {
		let teardownCalls = 0;
		const plugin: SeyfertPlugin = {
			name: 'lifecycle',
			teardown: () => {
				teardownCalls++;
			},
		};
		const client = new BaseClient({
			getRC: createRuntimeConfig,
			plugins: [plugin],
		});

		await client.start();

		await client.close();
		await client.close();

		assert.equal(teardownCalls, 1);
	});

	test('client can start plugins again after close', async () => {
		let setupCalls = 0;
		let teardownCalls = 0;
		const plugin: SeyfertPlugin = {
			name: 'restartable',
			setup: () => {
				setupCalls++;
			},
			teardown: () => {
				teardownCalls++;
			},
		};
		const client = new BaseClient({
			getRC: createRuntimeConfig,
			plugins: [plugin],
		});

		await client.start();
		await client.close();
		await client.start();
		await client.close();

		assert.equal(setupCalls, 2);
		assert.equal(teardownCalls, 2);
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

	test('resolves guild-scoped message commands from content using the message guild', () => {
		const client = new BaseClient({
			getRC: createRuntimeConfig,
		});

		const command = new Command();
		command.name = 'deploy';
		command.description = 'Deploy tools';
		command.contexts = [];
		command.integrationTypes = [];
		command.guildId = ['guild-1'];
		client.commands.values.push(command);
		client.handleCommand = new HandleCommand(client as never);

		const insideGuild = client.handleCommand.resolveCommandFromContent('deploy now', '!', {
			guild_id: 'guild-1',
		} as never);
		const outsideGuild = client.handleCommand.resolveCommandFromContent('deploy now', '!', {
			guild_id: 'guild-2',
		} as never);
		const directMessage = client.handleCommand.resolveCommandFromContent('deploy now', '!', {} as never);

		assert.equal(insideGuild.command, command);
		assert.equal(insideGuild.argsContent, 'now');
		assert.equal(outsideGuild.command, undefined);
		assert.equal(directMessage.command, undefined);
	});
});

class TranscodeCommand extends SubCommand {
	run() {}
}
