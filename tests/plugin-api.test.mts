import { describe, expect, test, vi } from 'vitest';
import {
	BaseCommand,
	Client,
	Command,
	ComponentCommand,
	createPlugin,
	createServiceKey,
	definePlugins,
	ModalCommand,
	type MiddlewareContext,
} from '../src';
import { BaseClient } from '../src/client/base';
import { resolveRawEventData } from '../src/events/utils';
import { GatewayIntentBits, GatewayOpcodes, type GatewaySendPayload } from '../src/types';
import { ShardManager } from '../src/websocket';

function runtimeConfig() {
	return {
		token: Buffer.from('bot').toString('base64'),
		locations: { base: '' },
		intents: 0,
	};
}

function gatewayInfo() {
	return {
		session_start_limit: {
			max_concurrency: 1,
			remaining: 1000,
			reset_after: 0,
			total: 1000,
		},
		shards: 1,
		url: 'wss://gateway.discord.gg',
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
	test('defines a canonical plugin tuple from rest arguments or an array', () => {
		const storage = createPlugin({ name: 'storage' });
		const economy = createPlugin({ name: 'economy', imports: [storage] });

		expect(definePlugins(economy, storage)).toEqual([economy, storage]);
		expect(definePlugins([economy, storage])).toEqual([economy, storage]);
		expect(definePlugins()).toEqual([]);
	});

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
		const calls: unknown[] = [];
		const plugin = createPlugin({
			name: 'events',
			register(api) {
				api.events.on('commandsLoaded', metadata => calls.push(metadata));
			},
		});
		const client = createGatewayClient([plugin]);

		await client.events.runCustom('commandsLoaded' as never, {
			kind: 'commands',
			total: 0,
			items: [],
			plugin: { total: 0, sources: {} },
		} as never);

		expect(calls).toEqual([expect.objectContaining({ kind: 'commands', total: 0 })]);
	});

	test('lets plugin event listeners emit custom events', async () => {
		const calls: string[] = [];
		const plugin = createPlugin({
			name: 'event-emitter',
			register(api) {
				api.events.on('botReady', () =>
					api.events.emit('commandsLoaded', {
						kind: 'commands',
						total: 0,
						items: [],
						plugin: { total: 0, sources: {} },
					}),
				);
				api.events.on('commandsLoaded', metadata => calls.push(metadata.kind));
			},
		});
		const client = createGatewayClient([plugin]);

		await client.events.runEvent('BOT_READY' as never, client, {} as never, -1, false);

		expect(calls).toEqual(['commands']);
	});

	test('emits commandsLoaded and componentsLoaded metadata', async () => {
		const snapshots: unknown[] = [];
		const plugin = createPlugin({
			name: 'loaded-observer',
			register(api) {
				api.events.on('commandsLoaded', payload => snapshots.push(payload));
				api.events.on('componentsLoaded', payload => snapshots.push(payload));
			},
		});
		const client = createGatewayClient([plugin]);
		client.loadEvents = async () => {};
		client.loadCommands = async () => {};
		client.loadComponents = async () => {};

		await client.start({}, false);

		expect(snapshots).toEqual([
			expect.objectContaining({
				kind: 'commands',
				total: expect.any(Number),
				plugin: expect.objectContaining({ total: expect.any(Number), sources: expect.any(Object) }),
			}),
			expect.objectContaining({
				kind: 'components',
				total: expect.any(Number),
				plugin: expect.objectContaining({ total: expect.any(Number), sources: expect.any(Object) }),
			}),
		]);
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

	test('warns and continues when an assigned middleware is not registered', async () => {
		const warn = vi.fn();
		const context = {
			client: {
				middlewares: {},
				logger: { warn },
			},
			command: { name: 'secure' },
			globalMetadata: {},
			metadata: {},
		} as never;

		const result = await BaseCommand.__runMiddlewares(context, ['auth' as never], false);

		expect(warn).toHaveBeenCalledOnce();
		expect(warn.mock.calls[0][0]).toContain('Command "secure"');
		expect(warn.mock.calls[0][0]).toContain('"auth"');
		expect(result).toEqual({});
	});

	test('runs registered middlewares when another assigned middleware is missing', async () => {
		const warn = vi.fn();
		const registered = vi.fn(({ next }) => next({ ran: true }));
		const context = {
			client: {
				middlewares: {
					registered,
				},
				logger: { warn },
			},
			command: { name: 'partial' },
			globalMetadata: {},
			metadata: {},
		} as never;

		const result = await BaseCommand.__runMiddlewares(context, ['registered' as never, 'missing' as never], false);

		expect(registered).toHaveBeenCalledOnce();
		expect(warn).toHaveBeenCalledOnce();
		expect(warn.mock.calls[0][0]).toContain('"missing"');
		expect(context.metadata).toEqual({ registered: { ran: true } });
		expect(result).toEqual({});
	});

	test('preserves undefined values returned by raw event transformers', async () => {
		const raw = { op: GatewayOpcodes.Dispatch, t: 'RESUMED', d: {} };

		await expect(resolveRawEventData('RESUMED', {} as never, raw)).resolves.toBeUndefined();
	});

	test('checks plugin requirements and records optional dependency warnings', () => {
		const storage = createPlugin({ name: 'storage' });
		const economy = createPlugin({
			name: 'economy',
			imports: [storage],
			requires: ['plugin:storage', { req: 'plugin:redis', optional: true }],
			register(api) {
				expect(api.has('plugin:storage')).toBe(true);
				expect(api.has('plugin:redis')).toBe(false);
			},
		});
		const client = createBaseClient([economy]);

		expect(client.plugins.diagnostics).toEqual([
			expect.objectContaining({ name: 'storage', requirements: [] }),
			expect.objectContaining({
				name: 'economy',
				requirements: [
					expect.objectContaining({ req: 'plugin:storage', optional: false, satisfied: true }),
					expect.objectContaining({ req: 'plugin:redis', optional: true, satisfied: false }),
				],
				warnings: [
					expect.objectContaining({
						code: 'missing-optional-requirement',
						phase: 'requires',
					}),
				],
			}),
		]);
	});

	test('throws attributed errors for missing required plugin dependencies', () => {
		const plugin = createPlugin({
			name: 'needs-storage',
			requires: ['plugin:storage'],
		});

		expect(() => createBaseClient([plugin])).toThrow(/needs-storage.*requires|requires.*needs-storage/);
	});

	test('lets plugins contribute gateway intents', async () => {
		const plugin = createPlugin({
			name: 'intent-plugin',
			register(api) {
				api.gateway.addIntents('Guilds');
			},
		});
		const client = createGatewayClient([plugin]);

		await client.start({}, false);

		expect(client.cache.intents & GatewayIntentBits.Guilds).toBe(GatewayIntentBits.Guilds);
	});

	test('emits uploadCommands metadata for plugin observers', async () => {
		const events: unknown[] = [];
		const plugin = createPlugin({
			name: 'upload-observer',
			register(api) {
				api.events.on('uploadCommands', metadata => events.push(metadata));
			},
		});
		const client = createGatewayClient([plugin]);
		const uploaded: unknown[] = [];
		client.rest = {
			proxy: {
				applications: (applicationId: string) => ({
					commands: {
						put: (data: unknown) => uploaded.push({ applicationId, data, scope: 'global' }),
					},
					guilds: (guildId: string) => ({
						commands: {
							put: (data: unknown) => uploaded.push({ applicationId, data, guildId, scope: 'guild' }),
						},
					}),
				}),
			},
		} as never;
		client.commands.values = [
			{
				name: 'global',
				toJSON: () => ({ name: 'global' }),
			},
		] as never;

		await client.uploadCommands({ applicationId: 'app' });

		expect(uploaded).toHaveLength(1);
		expect(events).toEqual([
			expect.objectContaining({
				applicationId: 'app',
				commands: 1,
				reason: 'forced',
				scope: 'global',
				status: 'uploaded',
			}),
		]);
	});

	test('wraps autocomplete execution through plugin hooks', async () => {
		const calls: string[] = [];
		const plugin = createPlugin({
			name: 'autocomplete-wrapper',
			register(api) {
				api.autocomplete.wrap(async ({ command }, next) => {
					calls.push('before');
					await next();
					calls.push(command?.name ?? 'missing');
					calls.push('after');
				});
			},
		});
		const client = createBaseClient([plugin]);
		await client.start();

		await client.handleCommand.autocomplete(
			{} as never,
			{
				fullCommandName: 'search',
				getCommand: () => ({ name: 'search' }),
			} as never,
			{
				name: 'query',
				autocomplete: async () => calls.push('run'),
			} as never,
		);

		expect(calls).toEqual(['before', 'run', 'query', 'after']);
	});

	test('wraps gateway send payloads through plugin hooks', async () => {
		const sent: GatewaySendPayload[] = [];
		const plugin = createPlugin({
			name: 'gateway-wrapper',
			register(api) {
				api.gateway.wrapPayload(({ payload }) => ({
					...payload,
					d: 'wrapped',
				}));
			},
		});
		const client = createGatewayClient([plugin]);
		client.setServices({
			gateway: new ShardManager({
				token: 'token',
				intents: 0,
				info: gatewayInfo(),
				handlePayload() {},
			}),
		});
		client.gateway.set(0, {
			send: async (_force: boolean, payload: GatewaySendPayload) => {
				sent.push(payload);
			},
		} as never);

		await client.gateway.send(0, { op: GatewayOpcodes.Heartbeat, d: null });

		expect(sent).toEqual([{ op: GatewayOpcodes.Heartbeat, d: 'wrapped' }]);
	});

	test('registers plugin services and resolves them lazily', () => {
		const calls: string[] = [];
		const ledgerKey = createServiceKey<{ readBalance(userId: string): number }>('runtime-ledger');
		const plugin = createPlugin({
			name: 'services',
			register(api) {
				api.services.set(ledgerKey, () => {
					calls.push('create service');
					return { readBalance: () => 100 };
				});
			},
		});
		const client = createBaseClient([plugin]);

		expect(client.services.has(ledgerKey)).toBe(true);
		expect(calls).toEqual([]);
		expect(client.services.require(ledgerKey).readBalance('user')).toBe(100);
		expect(client.services.get(ledgerKey)).toBe(client.services.get('runtime-ledger' as never));
		expect(calls).toEqual(['create service']);
	});

	test('wraps plugin service factory failures with plugin metadata', () => {
		const serviceKey = createServiceKey<{ ok: true }>('broken-service');
		const plugin = createPlugin({
			name: 'broken-service-plugin',
			register(api) {
				api.services.set(serviceKey, () => {
					throw new Error('service boom');
				});
			},
		});
		const client = createBaseClient([plugin]);

		expect(() => client.services.require(serviceKey)).toThrowError(
			expect.objectContaining({
				name: 'SeyfertPluginError',
				plugin: 'broken-service-plugin',
				phase: 'services.broken-service',
				index: 0,
			}),
		);
	});

	test('collects plugin diagnostics warnings and service contributions', () => {
		const serviceKey = createServiceKey<{ ok: true }>('diagnostic-service');
		const plugin = createPlugin({
			name: 'diagnostic-plugin',
			register(api) {
				api.services.set(serviceKey, { ok: true });
				api.diagnostics.warn('Optional package "redis" was not found.', { code: 'missing-optional-peer' });
			},
		});
		const client = createBaseClient([plugin]);

		expect(client.plugins.diagnostics).toEqual([
			expect.objectContaining({
				name: 'diagnostic-plugin',
				services: ['diagnostic-service'],
				warnings: [
					expect.objectContaining({
						code: 'missing-optional-peer',
						message: 'Optional package "redis" was not found.',
						phase: 'register',
					}),
				],
			}),
		]);
	});

	test('tracks lifecycle status in plugin diagnostics', async () => {
		const plugin = createPlugin({ name: 'status-plugin', setup() {} });
		const client = createBaseClient([plugin]);

		expect(client.plugins.diagnostics[0]?.status).toBe('registered');
		await client.start();
		expect(client.plugins.diagnostics[0]?.status).toBe('ready');
		await client.close();
		expect(client.plugins.diagnostics[0]?.status).toBe('closed');
	});

	test('wraps plugin event listener failures with plugin metadata', async () => {
		const failures: unknown[] = [];
		const plugin = createPlugin({
			name: 'bad-event',
			register(api) {
				api.events.on('botReady', () => {
					throw new Error('listener boom');
				});
			},
		});
		const client = createGatewayClient([plugin]);
		client.events.onFail = async (_name, error) => failures.push(error);

		await client.events.runEvent('BOT_READY' as never, client, {} as never, -1, false);

		expect(failures[0]).toMatchObject({
			name: 'SeyfertPluginError',
			plugin: 'bad-event',
			phase: 'event:BOT_READY',
			index: 0,
		});
	});

	test('supports plugin events.once utility', async () => {
		const calls: string[] = [];
		const plugin = createPlugin({
			name: 'once-listener',
			register(api) {
				api.events.once('botReady', () => calls.push('ready'));
			},
		});
		const client = createGatewayClient([plugin]);

		await client.events.runEvent('BOT_READY' as never, client, {} as never, -1, false);
		await client.events.runEvent('BOT_READY' as never, client, {} as never, -1, false);

		expect(calls).toEqual(['ready']);
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
