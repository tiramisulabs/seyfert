import { describe, expect, test } from 'vitest';
import { Client, type ClientOptions } from '../src/client/client';
import { resolveClientPlugins, runContextScopes, type SeyfertPlugin } from '../src/client/plugins';
import { createPlugin, GatewayIntentBits } from '../src';

function runtimeConfig() {
	return {
		token: 'header.payload.signature',
		locations: { base: process.cwd() },
	};
}

function createClient(options: ClientOptions = {}) {
	return new Client({
		getRC: async () => runtimeConfig(),
		...options,
	});
}

class RecordingClient extends Client {
	executeOptions?: { token?: string; intents?: number };

	protected async execute(options: { token?: string; intents?: number } = {}) {
		this.executeOptions = options;
	}

	async loadEvents() {}
}

function createRecordingClient(options: ClientOptions = {}) {
	const client = new RecordingClient({
		getRC: async () => ({ ...runtimeConfig(), intents: 0 }),
		...options,
	});
	(client as unknown as { gateway: unknown }).gateway = {};
	return client;
}

describe('client plugins', () => {
	test('passes normalized start option intents to execute', async () => {
		const plugin = createPlugin({
			name: 'execute-intents',
			register(api) {
				api.gateway.addIntents('GuildMembers');
			},
		});
		const client = createRecordingClient({ plugins: [plugin] });

		await client.start({ connection: { intents: ['Guilds'] } });

		expect(client.executeOptions?.intents).toBe(GatewayIntentBits.Guilds | GatewayIntentBits.GuildMembers);
	});

	test('composes context callbacks and global middlewares in plugin order before user options', () => {
		const pluginA: SeyfertPlugin = {
			name: 'plugin-a',
			options: () => ({
				context: () => ({ fromA: true, shared: 'plugin-a' }),
				globalMiddlewares: ['pluginA' as never],
			}),
		};
		const pluginB: SeyfertPlugin = {
			name: 'plugin-b',
			options: () => ({
				context: () => ({ fromB: true, shared: 'plugin-b' }),
				globalMiddlewares: ['pluginB' as never],
			}),
		};

		const client = createClient({
			plugins: [pluginA, pluginB],
			context: () => ({ fromUser: true, shared: 'user' }),
			globalMiddlewares: ['user' as never],
		});

		expect(client.options.context?.({} as never)).toEqual({
			fromA: true,
			fromB: true,
			fromUser: true,
			shared: 'user',
		});
		expect(client.options.globalMiddlewares).toEqual(['pluginA', 'pluginB', 'user']);
	});

	test('preserves base context and global middlewares before plugin and user options', () => {
		const plugin: SeyfertPlugin = {
			name: 'plugin',
			options: () => ({
				context: () => ({ fromPlugin: true, shared: 'plugin' }),
				globalMiddlewares: ['plugin' as never],
			}),
		};

		const { options } = resolveClientPlugins(
			{
				context: () => ({ fromBase: true, shared: 'base' }),
				globalMiddlewares: ['base' as never],
			},
			{
				plugins: [plugin],
				context: () => ({ fromUser: true, shared: 'user' }),
				globalMiddlewares: ['user' as never],
			},
		);

		expect(options.context?.({} as never)).toEqual({
			fromBase: true,
			fromPlugin: true,
			fromUser: true,
			shared: 'user',
		});
		expect(options.globalMiddlewares).toEqual(['base', 'plugin', 'user']);
	});

	test('runs plugin lifecycle hooks before user lifecycle hooks', async () => {
		const calls: string[] = [];
		const pluginA: SeyfertPlugin = {
			name: 'plugin-a',
			options: () => ({
				commands: {
					defaults: {
						onAfterRun: () => calls.push('plugin-a'),
					},
				},
			}),
		};
		const pluginB: SeyfertPlugin = {
			name: 'plugin-b',
			options: () => ({
				commands: {
					defaults: {
						onAfterRun: () => calls.push('plugin-b'),
					},
				},
			}),
		};

		const client = createClient({
			plugins: [pluginA, pluginB],
			commands: {
				defaults: {
					onAfterRun: () => calls.push('user'),
				},
			},
		});

		await client.options.commands?.defaults?.onAfterRun?.({} as never, undefined);

		expect(calls).toEqual(['plugin-a', 'plugin-b', 'user']);
	});

	test('composes context scopes in plugin order before user scopes', async () => {
		const calls: string[] = [];
		const pluginA: SeyfertPlugin = {
			name: 'plugin-a',
			options: () => ({
				contextScopes: [
					async (_context, run) => {
						calls.push('plugin-a before');
						const result = await run();
						calls.push('plugin-a after');
						return result;
					},
				],
			}),
		};
		const pluginB: SeyfertPlugin = {
			name: 'plugin-b',
			options: () => ({
				contextScopes: [
					async (_context, run) => {
						calls.push('plugin-b before');
						const result = await run();
						calls.push('plugin-b after');
						return result;
					},
				],
			}),
		};
		const client = createClient({
			plugins: [pluginA, pluginB],
			contextScopes: [
				async (_context, run) => {
					calls.push('user before');
					const result = await run();
					calls.push('user after');
					return result;
				},
			],
		});

		const result = await runContextScopes(client.options.contextScopes, {}, async () => {
			calls.push('handler');
			return 'done';
		});

		expect(result).toBe('done');
		expect(calls).toEqual([
			'plugin-a before',
			'plugin-b before',
			'user before',
			'handler',
			'user after',
			'plugin-b after',
			'plugin-a after',
		]);
	});

	test('runs setup once during start in plugin order', async () => {
		const calls: string[] = [];
		const pluginA: SeyfertPlugin = {
			name: 'plugin-a',
			setup: client => {
				expect(client.plugins.map(plugin => plugin.name)).toEqual(['plugin-a', 'plugin-b']);
				calls.push('plugin-a');
			},
		};
		const pluginB: SeyfertPlugin = {
			name: 'plugin-b',
			setup: () => {
				calls.push('plugin-b');
			},
		};
		const client = createClient({ plugins: [pluginA, pluginB] });

		(client as unknown as { gateway: unknown }).gateway = {};

		await client.start({ token: 'header.payload.signature' }, false);
		await client.start({ token: 'header.payload.signature' }, false);

		expect(calls).toEqual(['plugin-a', 'plugin-b']);
	});

	test('runs setup before cache start and command loading', async () => {
		const calls: string[] = [];
		const plugin: SeyfertPlugin = {
			name: 'plugin',
			setup: () => {
				calls.push('plugin');
			},
		};
		const client = createClient({ plugins: [plugin] });

		(client as unknown as { gateway: unknown }).gateway = {};
		client.cache.adapter.start = async () => {
			calls.push('cache');
		};
		client.loadLangs = async () => {
			calls.push('langs');
		};
		client.loadCommands = async () => {
			calls.push('commands');
		};
		client.loadComponents = async () => {
			calls.push('components');
		};

		await client.start({ token: 'header.payload.signature' }, false);

		expect(calls).toEqual(['plugin', 'cache', 'langs', 'commands', 'components']);
	});

	test('shares setup work across concurrent starts', async () => {
		const calls: string[] = [];
		let releaseSetup = () => {};
		const holdSetup = new Promise<void>(resolve => {
			releaseSetup = resolve;
		});
		const plugin: SeyfertPlugin = {
			name: 'plugin',
			setup: async () => {
				calls.push('plugin');
				await holdSetup;
			},
		};
		const client = createClient({ plugins: [plugin] });

		(client as unknown as { gateway: unknown }).gateway = {};

		const starts = [
			client.start({ token: 'header.payload.signature' }, false),
			client.start({ token: 'header.payload.signature' }, false),
		];

		try {
			await new Promise(resolve => setTimeout(resolve, 0));
			expect(calls).toEqual(['plugin']);
		} finally {
			releaseSetup();
			await Promise.allSettled(starts);
		}

		expect(calls).toEqual(['plugin']);
	});

	test('retries setup after plugin setup fails', async () => {
		const calls: string[] = [];
		const plugin: SeyfertPlugin = {
			name: 'plugin',
			setup: () => {
				calls.push('plugin');
				if (calls.length === 1) throw new Error('setup failed');
			},
		};
		const client = createClient({ plugins: [plugin] });

		(client as unknown as { gateway: unknown }).gateway = {};

		await expect(client.start({ token: 'header.payload.signature' }, false)).rejects.toThrow(
			/plugin.*setup|setup.*plugin/,
		);
		await expect(client.start({ token: 'header.payload.signature' }, false)).resolves.toBeUndefined();

		expect(calls).toEqual(['plugin', 'plugin']);
	});
});
