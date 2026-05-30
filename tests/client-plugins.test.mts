import { describe, expect, test } from 'vitest';
import { Client, type ClientOptions } from '../src/client/client';
import { resolveClientPlugins, type SeyfertPlugin } from '../src/client/plugins';

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

describe('client plugins', () => {
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
});
