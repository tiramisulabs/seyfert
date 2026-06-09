import { describe, expect, test } from 'vitest';
import { Client, Command, ComponentCommand, createPlugin, ModalCommand, type MiddlewareContext } from '../src';
import { BaseClient } from '../src/client/base';

function runtimeConfig() {
	return {
		token: Buffer.from('bot').toString('base64'),
		locations: { base: '' },
		intents: 0,
	};
}

function createBaseClient(plugins = [] as NonNullable<ConstructorParameters<typeof BaseClient>[0]>['plugins']) {
	return new BaseClient({ getRC: runtimeConfig, plugins });
}

function createGatewayClient(plugins = [] as NonNullable<ConstructorParameters<typeof Client>[0]>['plugins']) {
	const client = new Client({ getRC: runtimeConfig, plugins });
	(client as unknown as { gateway: unknown }).gateway = {};
	return client;
}

class PluginPing extends Command {
	name = 'plugin-ping';
	description = 'Plugin ping';
	run() {}
}

class DuplicatePing extends Command {
	name = 'plugin-ping';
	description = 'Duplicate ping';
	run() {}
}

class PluginButton extends ComponentCommand {
	componentType = 'Button' as const;
	customId = 'plugin-button';
	run() {}
}

class PluginModal extends ModalCommand {
	customId = 'plugin-modal';
	run() {}
}

describe('plugin api v3', () => {
	test('expands imports before importers and dedupes the same instance', () => {
		const storage = createPlugin({ name: 'storage' });
		const economy = createPlugin({ name: 'economy', imports: [storage] });
		const client = createBaseClient([economy, storage]);

		expect(client.plugins.map(plugin => plugin.name)).toEqual(['storage', 'economy']);
		expect(client.plugins.resolved.map(plugin => plugin.name)).toEqual(['storage', 'economy']);
	});

	test('throws when different plugin instances share a name', () => {
		const first = createPlugin({ name: 'same' });
		const second = createPlugin({ name: 'same' });

		expect(() => createBaseClient([first, second])).toThrow(/same/);
	});

	test('installs client map entries before setup', async () => {
		const calls: string[] = [];
		const service = { start: () => calls.push('start') };
		const plugin = createPlugin({
			name: 'service',
			client: { service: () => service },
			setup(client) {
				client.service.start();
			},
		});
		const client = createBaseClient([plugin]);

		await client.start();

		expect(calls).toEqual(['start']);
	});

	test('merges ctx map entries into context option', () => {
		const plugin = createPlugin({
			name: 'ctx',
			client: { marker: () => 'client-value' },
			ctx: { helper: (_interaction, client) => ({ marker: client.marker }) },
		});
		const client = createBaseClient([plugin]);

		expect(client.options.context?.({} as never)).toEqual({ helper: { marker: 'client-value' } });
	});

	test('runs register in resolved order before setup and applies option fragments', async () => {
		const calls: string[] = [];
		const imported = createPlugin({ name: 'imported', register: () => calls.push('register imported') });
		const parent = createPlugin({
			name: 'parent',
			imports: [imported],
			register(api) {
				calls.push('register parent');
				api.options.set({ allowedMentions: { parse: [] } });
			},
			setup: () => calls.push('setup parent'),
		});
		const client = createBaseClient([parent]);

		await client.start();

		expect(calls).toEqual(['register imported', 'register parent', 'setup parent']);
		expect(client.options.allowedMentions).toEqual({ parse: [] });
	});

	test('applies plugin commands after command loading', async () => {
		const plugin = createPlugin({
			name: 'commands',
			register(api) {
				api.commands.add(PluginPing);
			},
		});
		const client = createBaseClient([plugin]);
		client.loadCommands = async () => {
			client.commands.values = [];
		};

		await client.start();

		expect(client.commands.values.some(command => command.name === 'plugin-ping')).toBe(true);
	});

	test('applies plugin components and modals after component loading', async () => {
		const plugin = createPlugin({
			name: 'components',
			register(api) {
				api.components.add(PluginButton);
				api.modals.add(PluginModal);
			},
		});
		const client = createBaseClient([plugin]);
		client.loadComponents = async () => {};

		await client.start();

		expect(client.components.commands.some(component => component.customId === 'plugin-button')).toBe(true);
		expect(client.components.commands.some(component => component.customId === 'plugin-modal')).toBe(true);
	});

	test('throws attributed command conflicts', async () => {
		const first = createPlugin({
			name: 'first',
			register(api) {
				api.commands.add(PluginPing);
			},
		});
		const second = createPlugin({
			name: 'second',
			register(api) {
				api.commands.add(DuplicatePing);
			},
		});
		const client = createBaseClient([first, second]);

		await expect(client.start()).rejects.toThrow(/second.*commands|commands.*second/);
	});

	test('runs multiple plugin event listeners without last-wins', async () => {
		const calls: string[] = [];
		const first = createPlugin({
			name: 'first',
			register(api) {
				api.events.on('botReady', () => calls.push('first'));
			},
		});
		const second = createPlugin({
			name: 'second',
			register(api) {
				api.events.on('botReady', () => calls.push('second'));
			},
		});
		const client = createGatewayClient([first, second]);

		await client.events.runEvent('BOT_READY' as never, client, {} as never, -1, false);

		expect(calls.sort()).toEqual(['first', 'second']);
	});

	test('lets plugins observe commandsLoaded through the event bus', async () => {
		const calls: string[] = [];
		const plugin = createPlugin({
			name: 'events',
			register(api) {
				api.events.on('commandsLoaded', () => calls.push('commandsLoaded'));
			},
		});
		const client = createGatewayClient([plugin]);

		await client.events.runCustom('commandsLoaded' as never, client.commands.values as never);

		expect(calls).toEqual(['commandsLoaded']);
	});

	test('lets plugin event listeners emit custom events', async () => {
		const calls: string[] = [];
		const plugin = createPlugin({
			name: 'event-emitter',
			register(api) {
				api.events.on('botReady', () => api.events.emit('commandsLoaded', []));
				api.events.on('commandsLoaded', () => calls.push('commandsLoaded'));
			},
		});
		const client = createGatewayClient([plugin]);

		await client.events.runEvent('BOT_READY' as never, client, {} as never, -1, false);

		expect(calls).toEqual(['commandsLoaded']);
	});

	test('registers plugin middleware and global middleware option', () => {
		const audit: MiddlewareContext = ({ pass }) => pass();
		const plugin = createPlugin({
			name: 'middleware',
			register(api) {
				api.middlewares.add('audit' as never, audit, { global: true });
			},
		});
		const client = createBaseClient([plugin]);

		expect(client.middlewares?.audit).toBe(audit);
		expect(client.options.globalMiddlewares).toContain('audit');
	});

	test('attributes register errors to plugin and phase', () => {
		const plugin = createPlugin({
			name: 'bad-register',
			register() {
				throw new Error('boom');
			},
		});

		expect(() => createBaseClient([plugin])).toThrow(/bad-register.*register|register.*bad-register/);
	});
});
