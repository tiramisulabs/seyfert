import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, test, vi } from 'vitest';
import {
	BaseCommand,
	BaseResource,
	Client,
	Command,
	ComponentCommand,
	createMiddleware,
	createPlugin,
	definePlugin,
	createSharedKey,
	definePlugins,
	GatewayIntentBits,
	GatewayOpcodes,
	ModalCommand,
	PluginOrder,
	runPluginCommandObservers,
	runPluginHooks,
	WorkerClient,
	type Cache,
	type GatewayDispatchPayload,
	type GatewaySendPayload,
	type MiddlewareContext,
} from '../src';
import { BaseClient } from '../src/client/base';
import { resolveRawEventData } from '../src/events/utils';
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

class HandlerCommand extends Command {
	name = 'handler-command';
	description = 'Handler command';
	run() {}
}

class HandlerInstanceCommand extends Command {
	name = 'handler-instance-command';
	description = 'Handler instance command';
	run() {}
}

class HandlerButton extends ComponentCommand {
	componentType = 'Button' as const;
	customId = 'handler-button';
	run() {}
}

class HandlerInstanceButton extends ComponentCommand {
	componentType = 'Button' as const;
	customId = 'handler-instance-button';
	run() {}
}

class HandlerModal extends ModalCommand {
	customId = 'handler-modal';
	run() {}
}

class HandlerInstanceModal extends ModalCommand {
	customId = 'handler-instance-modal';
	run() {}
}

class LoadedHandlerCommand extends Command {
	name = 'loaded-handler-command';
	description = 'Loaded handler command';
	run() {}
}

class LoadedHandlerButton extends ComponentCommand {
	componentType = 'Button' as const;
	customId = 'loaded-handler-button';
	run() {}
}

class LoadedHandlerModal extends ModalCommand {
	customId = 'loaded-handler-modal';
	run() {}
}

class PluginCacheResource extends BaseResource<{ id: string }, { id: string }> {
	namespace = 'plugin-resource';
}

const tempDirs: string[] = [];

afterEach(async () => {
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
	await Promise.all(tempDirs.splice(0).map(dir => rm(dir, { recursive: true, force: true })));
	delete (globalThis as { __SeyfertReloadCommandBase?: unknown }).__SeyfertReloadCommandBase;
	delete (globalThis as { __SeyfertReloadComponentBase?: unknown }).__SeyfertReloadComponentBase;
	delete (globalThis as { __SeyfertReloadModalBase?: unknown }).__SeyfertReloadModalBase;
});

describe('plugin api v3', () => {
	test('defines a canonical plugin tuple from rest arguments or an array', () => {
		const storage = createPlugin({ name: 'storage' });
		const economy = createPlugin({ name: 'economy', imports: [storage] });

		expect(definePlugins(economy, storage)).toEqual([economy, storage]);
		expect(definePlugins([economy, storage])).toEqual([economy, storage]);
		expect(definePlugins()).toEqual([]);
	});

	test('wraps definePlugin function factory errors with attribution', () => {
		const factory = definePlugin((_options: { enabled: boolean }) => {
			throw new Error('invalid config');
		});

		expect(() => factory({ enabled: true })).toThrow(/definePlugin.*options|options.*definePlugin/);
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

	test('recomposes setup-scoped options defaults wrappers and intents', async () => {
		const plugin = createPlugin({
			name: 'setup-options',
			setup(_client, api) {
				api?.options.set({ allowedMentions: { parse: [] } });
				api?.commands.defaults({ props: { fromSetup: true } });
				api?.gateway.addIntents('Guilds');
				api?.autocomplete.wrap((_payload, next) => next());
				api?.gateway.wrapPayload(({ payload }) => payload);
			},
		});
		const client = createBaseClient([plugin]);

		await client.start();

		expect(client.options.allowedMentions).toEqual({ parse: [] });
		expect(client.options.commands?.defaults?.props).toEqual({ fromSetup: true });
		expect(client.cache.intents & GatewayIntentBits.Guilds).toBe(GatewayIntentBits.Guilds);
		expect(client.pluginRegistry.autocompleteWrappers).toHaveLength(1);
		expect(client.pluginRegistry.gatewayPayloadWrappers).toHaveLength(1);
	});

	test('resolves worker gateway intents after setup-scoped plugin contributions', async () => {
		const messages: unknown[] = [];
		const plugin = createPlugin({
			name: 'worker-intents',
			setup(_client, api) {
				api?.gateway.addIntents('Guilds');
			},
		});
		const client = new WorkerClient({
			getRC: runtimeConfig,
			plugins: [plugin],
			postMessage: body => messages.push(body),
		});
		client.setWorkerData({
			compress: false,
			debug: false,
			info: gatewayInfo(),
			intents: GatewayIntentBits.GuildMembers,
			mode: 'custom',
			path: '',
			resharding: false,
			shards: [],
			token: 'token',
			totalShards: 1,
			totalWorkers: 1,
			workerId: 1,
			workerProxy: false,
		});

		await client.start();

		expect(client.workerData.intents & GatewayIntentBits.GuildMembers).toBe(GatewayIntentBits.GuildMembers);
		expect(client.workerData.intents & GatewayIntentBits.Guilds).toBe(GatewayIntentBits.Guilds);
		expect(messages[0]).toEqual({ type: 'WORKER_START', workerId: 1 });
	});

	test('cleans setup-scoped options defaults wrappers and intents after setup failure', async () => {
		const plugin = createPlugin({
			name: 'setup-failure-cleanup',
			setup(_client, api) {
				api?.options.set({ allowedMentions: { parse: [] } });
				api?.commands.defaults({ props: { leaked: true } });
				api?.gateway.addIntents('Guilds');
				api?.autocomplete.wrap((_payload, next) => next());
				api?.gateway.wrapPayload(({ payload }) => payload);
				throw new Error('setup boom');
			},
		});
		const client = createBaseClient([plugin]);

		await expect(client.start()).rejects.toThrow(/setup boom/);

		expect(client.options.allowedMentions).toBeUndefined();
		expect(client.options.commands?.defaults?.props).toBeUndefined();
		expect(client.cache.intents & GatewayIntentBits.Guilds).toBe(0);
		expect(client.pluginRegistry.autocompleteWrappers).toHaveLength(0);
		expect(client.pluginRegistry.gatewayPayloadWrappers).toHaveLength(0);
		expect(client.pluginRegistry.gatewayIntents).toHaveLength(0);
		expect(client.pluginRegistry.pluginDefaults).toHaveLength(0);
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

	test('preserves plugin source metadata when command transformers rename instances', async () => {
		const events: unknown[] = [];
		const plugin = createPlugin({
			name: 'rename-source',
			register(api) {
				api.commands.add(PluginPing);
				api.handlers.transform(command => {
					if (command instanceof Command) command.name = 'renamed-plugin-ping';
					return command;
				}, { kinds: ['command'] });
				api.events.on('commandsLoaded', metadata => events.push(metadata));
			},
		});
		const client = createBaseClient([plugin]);

		await client.start();

		expect(client.commands.values.map(command => command.name)).toEqual(['renamed-plugin-ping']);
		expect(events).toContainEqual(
			expect.objectContaining({
				plugin: { total: 1, sources: { 'rename-source': 1 } },
			}),
		);
	});

	test('preserves props on plugin-added command instances', async () => {
		const command = new PluginPing();
		command.props = { existing: true };
		const plugin = createPlugin({
			name: 'instance-props',
			register(api) {
				api.commands.defaults({ props: { fromDefault: true } });
				api.commands.add(command);
			},
		});
		const client = createBaseClient([plugin]);

		await client.start();

		expect(client.commands.values.find(entry => entry.name === 'plugin-ping')?.props).toEqual({ existing: true });
	});

	test('applies plugin command guild scope before upload', async () => {
		const plugin = createPlugin({
			name: 'guild-commands',
			register(api) {
				api.commands.add(PluginPing, { guilds: ['guild-1', 'guild-2'] });
			},
		});
		const client = createBaseClient([plugin]);
		client.loadCommands = async () => {
			client.commands.values = [];
		};

		await client.start();

		const command = client.commands.values.find(command => command.name === 'plugin-ping');
		expect(command?.guildId).toEqual(['guild-1', 'guild-2']);
		expect(client.plugins.diagnostics[0]?.messages).toEqual([
			expect.objectContaining({
				code: 'command-guild-scope',
				phase: 'commands.add',
				severity: 'info',
			}),
		]);
	});

	test('allows global and guild-scoped command variants with the same name', async () => {
		const plugin = createPlugin({
			name: 'command-scope-identity',
			register(api) {
				api.commands.add(PluginPing);
				api.commands.add(DuplicatePing, { guilds: ['guild-1'] });
			},
		});
		const client = createBaseClient([plugin]);
		client.loadCommands = async () => {
			client.commands.values = [];
		};

		await client.start();

		expect(client.commands.values.filter(command => command.name === 'plugin-ping')).toHaveLength(2);
		expect(client.commands.values.map(command => command.guildId)).toContainEqual(['guild-1']);
	});

	test('uploads plugin guild-scoped commands separately from global commands', async () => {
		const plugin = createPlugin({
			name: 'guild-upload',
			register(api) {
				api.commands.add(PluginPing, { guilds: ['guild-1'] });
			},
		});
		const client = createBaseClient([plugin]);
		const uploaded: unknown[] = [];
		client.loadCommands = async () => {
			client.commands.values = [];
		};

		await client.start();
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
		await client.uploadCommands({ applicationId: 'app' });

		expect(uploaded).toEqual([
			{ applicationId: 'app', data: { body: [] }, scope: 'global' },
			{
				applicationId: 'app',
				data: { body: [expect.objectContaining({ name: 'plugin-ping' })] },
				guildId: 'guild-1',
				scope: 'guild',
			},
		]);
	});

	test('clears stale guild commands from the upload cache', async () => {
		const client = createBaseClient();
		const dir = await mkdtemp(join(tmpdir(), 'seyfert-plugin-upload-'));
		tempDirs.push(dir);
		const cachePath = join(dir, 'commands.json');
		await writeFile(
			cachePath,
			JSON.stringify([{ name: 'old-guild-command', description: 'old', type: 1, guild_id: ['guild-1'] }]),
		);
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

		await client.uploadCommands({ applicationId: 'app', cachePath });

		expect(uploaded).toEqual([
			{ applicationId: 'app', data: { body: [] }, guildId: 'guild-1', scope: 'guild' },
		]);
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

	test('keeps component and modal customId identity separate', async () => {
		class SharedButton extends ComponentCommand {
			componentType = 'Button' as const;
			customId = 'shared-id';
			run() {}
		}
		class SharedModal extends ModalCommand {
			customId = 'shared-id';
			run() {}
		}
		const plugin = createPlugin({
			name: 'shared-component-modal-id',
			register(api) {
				api.components.add(SharedButton);
				api.modals.add(SharedModal);
			},
		});
		const client = createBaseClient([plugin]);
		client.loadComponents = async () => {};

		await client.start();

		expect(client.components.commands.filter(component => component.customId === 'shared-id')).toHaveLength(2);
	});

	test('rejects wrong component and modal classes registered through plugin APIs', async () => {
		const componentPlugin = createPlugin({
			name: 'wrong-component',
			register(api) {
				api.components.add(PluginModal as never);
			},
		});
		const modalPlugin = createPlugin({
			name: 'wrong-modal',
			register(api) {
				api.modals.add(PluginButton as never);
			},
		});

		await expect(createBaseClient([componentPlugin]).start()).rejects.toThrow(/ComponentCommand/);
		await expect(createBaseClient([modalPlugin]).start()).rejects.toThrow(/ModalCommand/);
	});

	test('applies unified handler creators and transformers to plugin handlers', async () => {
		const createKinds: string[] = [];
		const transformed: string[] = [];
		const commandInstance = new HandlerInstanceCommand();
		const componentInstance = new HandlerInstanceButton();
		const modalInstance = new HandlerInstanceModal();
		const plugin = createPlugin({
			name: 'handlers',
			register(api) {
				api.handlers.create((_constructor, next, metadata) => {
					createKinds.push(metadata.kind);
					return next();
				});
				api.handlers.transform((instance, metadata) => {
					transformed.push(`${metadata.kind}:${'name' in instance ? instance.name : instance.customId}`);
					instance.props ??= {};
					instance.props.handlerKind = metadata.kind;
				});
				api.commands.add(HandlerCommand);
				api.commands.add(commandInstance);
				api.components.add(HandlerButton);
				api.components.add(componentInstance);
				api.modals.add(HandlerModal);
				api.modals.add(modalInstance);
			},
		});
		const client = createBaseClient([plugin]);
		client.loadCommands = async () => {
			client.commands.values = [];
		};
		client.loadComponents = async () => {};

		await client.start();

		expect(createKinds.sort()).toEqual(['command', 'component', 'modal']);
		expect(transformed.sort()).toEqual([
			'command:handler-command',
			'command:handler-instance-command',
			'component:handler-button',
			'component:handler-instance-button',
			'modal:handler-instance-modal',
			'modal:handler-modal',
		]);
		expect(client.commands.values.find(command => command.name === 'handler-command')?.props.handlerKind).toBe('command');
		expect(client.commands.values.find(command => command.name === 'handler-instance-command')).toBe(commandInstance);
		expect(client.components.commands.find(component => component.customId === 'handler-button')?.props.handlerKind).toBe(
			'component',
		);
		expect(client.components.commands.find(component => component.customId === 'handler-instance-modal')).toBe(
			modalInstance,
		);
	});

	test('rejects invalid handler kinds', () => {
		expect(() =>
			createBaseClient([
				createPlugin({
					name: 'bad-handler-kind',
					register(api) {
						api.handlers.create((_constructor, next) => next(), { kinds: ['commands' as never] });
					},
				}),
			]),
		).toThrow(/Handler kind "commands" is invalid/);
	});

	test('applies unified handler creators and transformers to file-loaded handlers', async () => {
		const createKinds: string[] = [];
		const transformed: string[] = [];
		const plugin = createPlugin({
			name: 'loaded-handlers',
			register(api) {
				api.handlers.create((_constructor, next, metadata) => {
					createKinds.push(metadata.kind);
					return next();
				});
				api.handlers.transform((instance, metadata) => {
					transformed.push(`${metadata.kind}:${'name' in instance ? instance.name : instance.customId}`);
					instance.props ??= {};
					instance.props.handlerKind = metadata.kind;
				});
			},
		});
		const client = new BaseClient({
			getRC: () => ({
				token: Buffer.from('bot').toString('base64'),
				locations: { base: '', commands: '/commands', components: '/components' },
				intents: 0,
			}),
			plugins: [plugin],
		});
		vi.spyOn(client.commands as never, 'getFiles').mockResolvedValue(['/commands/loaded-command.js']);
		vi.spyOn(client.commands as never, 'loadFilesK').mockResolvedValue([
			{
				name: 'loaded-command.js',
				path: '/commands/loaded-command.js',
				file: { default: LoadedHandlerCommand },
			},
		]);
		vi.spyOn(client.components as never, 'getFiles').mockResolvedValue([
			'/components/loaded-button.js',
			'/components/loaded-modal.js',
		]);
		vi.spyOn(client.components as never, 'loadFilesK').mockResolvedValue([
			{
				name: 'loaded-button.js',
				path: '/components/loaded-button.js',
				file: { default: LoadedHandlerButton },
			},
			{
				name: 'loaded-modal.js',
				path: '/components/loaded-modal.js',
				file: { default: LoadedHandlerModal },
			},
		]);

		await client.start();

		expect(createKinds.sort()).toEqual(['command', 'component', 'modal']);
		expect(transformed.sort()).toEqual([
			'command:loaded-handler-command',
			'component:loaded-handler-button',
			'modal:loaded-handler-modal',
		]);
		expect(client.commands.values.find(command => command.name === 'loaded-handler-command')?.props.handlerKind).toBe(
			'command',
		);
		expect(client.components.commands.find(component => component.customId === 'loaded-handler-button')?.props.handlerKind).toBe(
			'component',
		);
		expect(client.components.commands.find(component => component.customId === 'loaded-handler-modal')?.props.handlerKind).toBe(
			'modal',
		);
	});

	test('applies unified handler creators and transformers during reload', async () => {
		class ReloadCommand extends Command {
			name = 'reload-command';
			description = 'Reload command';
			run() {}
		}
		class ReloadButton extends ComponentCommand {
			componentType = 'Button' as const;
			customId = 'reload-button';
			run() {}
		}
		class ReloadModal extends ModalCommand {
			customId = 'reload-modal';
			run() {}
		}
		const createKinds: string[] = [];
		const transformed: string[] = [];
		const plugin = createPlugin({
			name: 'reload-handlers',
			register(api) {
				api.handlers.construct((_constructor, next, metadata) => {
					createKinds.push(metadata.kind);
					return next();
				});
				api.handlers.transform((instance, metadata) => {
					transformed.push(metadata.kind);
					instance.props ??= {};
					instance.props.reloadKind = metadata.kind;
				});
			},
		});
		const client = createBaseClient([plugin]);
		const dir = await mkdtemp(join(tmpdir(), 'seyfert-plugin-reload-'));
		tempDirs.push(dir);
		const commandPath = join(dir, 'reload-command.cjs');
		const buttonPath = join(dir, 'reload-button.cjs');
		const modalPath = join(dir, 'reload-modal.cjs');
		(globalThis as { __SeyfertReloadCommandBase?: typeof Command }).__SeyfertReloadCommandBase = Command;
		(globalThis as { __SeyfertReloadComponentBase?: typeof ComponentCommand }).__SeyfertReloadComponentBase =
			ComponentCommand;
		(globalThis as { __SeyfertReloadModalBase?: typeof ModalCommand }).__SeyfertReloadModalBase = ModalCommand;
		await writeFile(
			commandPath,
			[
				'const Command = globalThis.__SeyfertReloadCommandBase;',
				'module.exports = class extends Command {',
				"  name = 'reload-command';",
				"  description = 'Reload command';",
				'  run() {}',
				'};',
			].join('\n'),
		);
		await writeFile(
			buttonPath,
			[
				'const ComponentCommand = globalThis.__SeyfertReloadComponentBase;',
				'module.exports = class extends ComponentCommand {',
				"  componentType = 'Button';",
				"  customId = 'reload-button';",
				'  run() {}',
				'};',
			].join('\n'),
		);
		await writeFile(
			modalPath,
			[
				'const ModalCommand = globalThis.__SeyfertReloadModalBase;',
				'module.exports = class extends ModalCommand {',
				"  customId = 'reload-modal';",
				'  run() {}',
				'};',
			].join('\n'),
		);
		const command = new ReloadCommand();
		command.__filePath = commandPath;
		const button = new ReloadButton();
		button.__filePath = buttonPath;
		const modal = new ReloadModal();
		modal.__filePath = modalPath;
		client.commands.values = [command];
		client.components.commands.splice(0, client.components.commands.length, button, modal);

		await client.commands.reload('reload-command');
		await client.components.reload(buttonPath);
		await client.components.reload(modalPath);

		expect(createKinds.sort()).toEqual(['command', 'component', 'modal']);
		expect(transformed.sort()).toEqual(['command', 'component', 'modal']);
		expect(client.commands.values[0]?.props.reloadKind).toBe('command');
		expect(client.components.commands.find(component => component.customId === 'reload-button')?.props.reloadKind).toBe(
			'component',
		);
		expect(client.components.commands.find(component => component.customId === 'reload-modal')?.props.reloadKind).toBe(
			'modal',
		);
	});

	test('keeps plugin lang overlays after lang reload', async () => {
		const plugin = createPlugin({
			name: 'lang-overlay',
			register(api) {
				api.langs.contribute('en', { message: 'overlay' }, { prefix: 'plugin' });
			},
		});
		const client = createBaseClient([plugin]);
		const dir = await mkdtemp(join(tmpdir(), 'seyfert-plugin-langs-'));
		tempDirs.push(dir);
		const langPath = join(dir, 'en.cjs');
		await writeFile(langPath, "module.exports = { default: { root: 'reloaded' } };\n");
		vi.spyOn(client.langs as never, 'getFiles').mockResolvedValue([langPath]);
		vi.spyOn(client.langs as never, 'loadFilesK').mockResolvedValue([
			{
				name: 'en.cjs',
				path: langPath,
				file: { default: { root: 'base' } },
			},
		]);

		await client.loadLangs(dir);
		expect(client.langs.values.en).toEqual({ root: 'base', plugin: { message: 'overlay' } });

		await client.langs.reload('en');

		expect(client.langs.values.en).toEqual({ root: 'reloaded', plugin: { message: 'overlay' } });
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

	test('orders exact and any plugin event listeners together', async () => {
		const calls: string[] = [];
		const any = createPlugin({
			name: 'any-listener',
			register(api) {
				api.events.onAny(name => calls.push(`any:${name}`), { order: PluginOrder.After });
			},
		});
		const exact = createPlugin({
			name: 'exact-listener',
			register(api) {
				api.events.on('commandsLoaded', () => calls.push('exact'), { order: PluginOrder.Before });
			},
		});
		const client = createBaseClient([any, exact]);

		await client.events.runCustom('commandsLoaded', {
			kind: 'commands',
			total: 0,
			items: [],
			plugin: { total: 0, sources: Object.create(null) },
		});

		expect(calls).toEqual(['exact', 'any:commandsLoaded']);
	});

	test('lets plugin event listeners emit custom events', async () => {
		const calls: string[] = [];
		const plugin = createPlugin({
			name: 'event-emitter',
			register(api) {
				api.events.on('botReady', (_bot, client) =>
					client.events.emit('commandsLoaded', {
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

	test('returns middleware denial metadata for stopped global and command middleware', async () => {
		const stopGlobal = createMiddleware<void>(({ stop }) => stop('global denied'));
		const stopCommand = createMiddleware<void>(({ stop }) => stop('command denied'));
		const context = {
			client: {
				middlewares: {
					stopCommand,
					stopGlobal,
				},
				logger: { warn: vi.fn() },
			},
			command: { name: 'secure' },
			globalMetadata: {},
			metadata: {},
		} as never;

		await expect(BaseCommand.__runMiddlewares(context, ['stopGlobal' as never], true)).resolves.toEqual({
			error: 'global denied',
			metadata: { middleware: 'stopGlobal', scope: 'global' },
		});
		await expect(BaseCommand.__runMiddlewares(context, ['stopCommand' as never], false)).resolves.toEqual({
			error: 'command denied',
			metadata: { middleware: 'stopCommand', scope: 'command' },
		});
	});

	test('runs command observers with middleware denial metadata and isolates observer failures', async () => {
		const calls: unknown[] = [];
		const logger = { error: vi.fn() };
		const good = createPlugin({
			name: 'good-observer',
			register(api) {
				api.commands.observe({
					onMiddlewaresError(_context, error, metadata) {
						calls.push({ error, metadata });
					},
				});
			},
		});
		const bad = createPlugin({
			name: 'bad-observer',
			register(api) {
				api.commands.observe({
					onMiddlewaresError() {
						throw new Error('observer failed');
					},
				});
			},
		});
		const client = createBaseClient([bad, good]);
		client.logger = logger as never;

		await runPluginCommandObservers(
			client,
			'onMiddlewaresError',
			{} as never,
			'denied',
			{ middleware: 'auth', scope: 'global' },
		);

		expect(calls).toEqual([{ error: 'denied', metadata: { middleware: 'auth', scope: 'global' } }]);
		expect(logger.error).toHaveBeenCalledOnce();
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
				messages: [
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

	test('does not authorize overrides through optional unsatisfied requirements', async () => {
		const owner = createPlugin({
			name: 'owner',
			version: '1.0.0',
			register(api) {
				api.commands.add(PluginPing);
			},
		});
		const mutator = createPlugin({
			name: 'mutator',
			imports: [owner],
			requires: [{ req: 'plugin:owner', range: '>=2.0.0', optional: true }],
			register(api) {
				api.commands.add(DuplicatePing, { override: true });
			},
		});
		const client = createBaseClient([mutator]);

		await expect(client.start()).rejects.toThrow(/requires plugin "owner"/);
	});

	test('lets plugins contribute gateway intents from gateway and cache APIs', async () => {
		const plugin = createPlugin({
			name: 'intent-plugin',
			register(api) {
				api.gateway.addIntents('Guilds');
				api.cache.resource('intentCache', PluginCacheResource, { intents: [GatewayIntentBits.GuildMembers] });
			},
		});
		const client = createGatewayClient([plugin]);

		await client.start({}, false);

		expect(client.cache.intents & GatewayIntentBits.Guilds).toBe(GatewayIntentBits.Guilds);
		expect(client.cache.intents & GatewayIntentBits.GuildMembers).toBe(GatewayIntentBits.GuildMembers);
	});

	test('diagnoses invalid gateway intent strings without registering undefined bits', () => {
		const plugin = createPlugin({
			name: 'bad-intents',
			register(api) {
				api.gateway.addIntents('NotAnIntent' as never, 'Guilds');
			},
		});
		const client = createBaseClient([plugin]);

		expect(client.cache.intents & GatewayIntentBits.Guilds).toBe(GatewayIntentBits.Guilds);
		expect(client.plugins.diagnostics[0]?.messages).toEqual([
			expect.objectContaining({
				code: 'unknown-intent-bits',
				phase: 'gateway.addIntents',
			}),
		]);
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

	test('registers plugin shared values and resolves them lazily through unwrap', () => {
		const calls: string[] = [];
		const ledgerKey = createSharedKey<{ readBalance(userId: string): number }>()('runtime-ledger');
		const plugin = createPlugin({
			name: 'shared',
			register(api) {
				api.shared.set(ledgerKey, () => {
					calls.push('create shared');
					return { readBalance: () => 100 };
				});
			},
		});
		const client = createBaseClient([plugin]);

		expect(client.shared.has(ledgerKey)).toBe(true);
		expect(calls).toEqual([]);
		expect(client.shared.unwrap(ledgerKey).readBalance('user')).toBe(100);
		expect(client.shared.get(ledgerKey)).toBe(client.shared.get('runtime-ledger' as never));
		expect(calls).toEqual(['create shared']);
	});

	test('unwrap returns registered undefined shared values', () => {
		const undefinedKey = createSharedKey<undefined>()('undefined-shared');
		const plugin = createPlugin({
			name: 'undefined-shared-plugin',
			register(api) {
				api.shared.set(undefinedKey, () => undefined);
			},
		});
		const client = createBaseClient([plugin]);

		expect(client.shared.has(undefinedKey)).toBe(true);
		expect(client.shared.unwrap(undefinedKey)).toBeUndefined();
	});

	test('restores setup-scoped shared overrides on close', async () => {
		const disposed: string[] = [];
		const key = createSharedKey<{ owner: string }>()('restore-shared');
		const owner = createPlugin({
			name: 'shared-owner',
			register(api) {
				api.shared.set(key, () => ({ owner: 'base' }));
			},
		});
		const override = createPlugin({
			name: 'shared-override',
			imports: [owner],
			requires: ['plugin:shared-owner'],
			setup(_client, api) {
				api?.shared.set(key, () => ({ owner: 'override' }), {
					async dispose(value) {
						await Promise.resolve();
						disposed.push(value.owner);
					},
					override: true,
				});
			},
		});
		const client = createBaseClient([override]);

		await client.start();
		expect(client.shared.unwrap(key)).toEqual({ owner: 'override' });
		await client.close();
		expect(client.shared.unwrap(key)).toEqual({ owner: 'base' });
		expect(disposed).toEqual(['override']);
	});

	test('wraps plugin shared factory failures with plugin metadata', () => {
		const sharedKey = createSharedKey<{ ok: true }>()('broken-shared');
		const plugin = createPlugin({
			name: 'broken-shared-plugin',
			register(api) {
				api.shared.set(sharedKey, () => {
					throw new Error('shared boom');
				});
			},
		});
		const client = createBaseClient([plugin]);

		expect(() => client.shared.unwrap(sharedKey)).toThrowError(
			expect.objectContaining({
				name: 'SeyfertPluginError',
				plugin: 'broken-shared-plugin',
				phase: 'shared.broken-shared',
				index: 0,
			}),
		);
	});

	test('collects plugin diagnostics warnings and shared contributions', () => {
		const sharedKey = createSharedKey<{ ok: true }>()('diagnostic-shared');
		const plugin = createPlugin({
			name: 'diagnostic-plugin',
			register(api) {
				api.shared.set(sharedKey, () => ({ ok: true }));
				api.diagnostics.warn('Optional package "redis" was not found.', { code: 'missing-optional-peer' });
			},
		});
		const client = createBaseClient([plugin]);

		expect(client.plugins.diagnostics).toEqual([
			expect.objectContaining({
				name: 'diagnostic-plugin',
				shared: ['diagnostic-shared'],
				messages: [
					expect.objectContaining({
						code: 'missing-optional-peer',
						message: 'Optional package "redis" was not found.',
						phase: 'register',
					}),
				],
			}),
		]);
	});

	test('exposes immutable plugin diagnostics snapshots', () => {
		const plugin = createPlugin({ name: 'diagnostic-freeze', client: { frozenClient: () => true } });
		const client = createBaseClient([plugin]);
		const diagnostics = client.plugins.diagnostics;

		expect(Object.isFrozen(client.plugins)).toBe(true);
		expect(Object.isFrozen(client.plugins.resolved)).toBe(true);
		expect(Object.isFrozen(diagnostics)).toBe(true);
		expect(Object.isFrozen(diagnostics[0])).toBe(true);
		expect(Object.isFrozen(diagnostics[0]!.clientKeys)).toBe(true);
	});

	test('installs plugin cache resources and routes packets through custom handlers', async () => {
		const packets: GatewayDispatchPayload[] = [];
		const plugin = createPlugin({
			name: 'cache-plugin',
			register(api) {
				api.cache.resource('pluginResource', PluginCacheResource, {
					onPacket(event) {
						packets.push(event);
					},
				});
			},
		});
		const client = createBaseClient([plugin]);

		expect((client.cache as Cache & { pluginResource?: PluginCacheResource }).pluginResource).toBeInstanceOf(
			PluginCacheResource,
		);
		await client.cache.onPacket({ t: 'RESUMED', op: GatewayOpcodes.Dispatch, s: 1, d: {} });

		expect(packets).toEqual([expect.objectContaining({ t: 'RESUMED' })]);
	});

	test('rejects unsafe cache resource and ctx keys', () => {
		expect(() =>
			createBaseClient([
				createPlugin({
					name: 'bad-cache-key',
					register(api) {
						api.cache.resource('__proto__', PluginCacheResource);
					},
				}),
			]),
		).toThrow(/unsafe|reserved/);

		expect(() =>
			createBaseClient([
				createPlugin({
					name: 'bad-ctx-key',
					ctx: { client: () => 'bad' },
				}),
			]),
		).toThrow(/unsafe|reserved/);
	});

	test('isolates plugin cache resource packet handler failures', async () => {
		const calls: string[] = [];
		const logger = { error: vi.fn() };
		const bad = createPlugin({
			name: 'bad-cache-packet',
			register(api) {
				api.cache.resource('badPacket', PluginCacheResource, {
					onPacket() {
						throw new Error('packet boom');
					},
				});
			},
		});
		const good = createPlugin({
			name: 'good-cache-packet',
			register(api) {
				api.cache.resource('goodPacket', PluginCacheResource, {
					onPacket() {
						calls.push('good');
					},
				});
			},
		});
		const client = createBaseClient([bad, good]);
		client.logger = logger as never;
		client.refreshPluginContributions();

		await client.cache.onPacket({ t: 'RESUMED', op: GatewayOpcodes.Dispatch, s: 1, d: {} });

		expect(calls).toEqual(['good']);
		expect(logger.error).toHaveBeenCalledWith(
			'[plugin:bad-cache-packet] cache.resource.onPacket failed',
			expect.any(Error),
		);
	});

	test('keeps disabled cache state when refreshing plugin cache resources', () => {
		const plugin = createPlugin({
			name: 'cache-plugin',
			register(api) {
				api.cache.resource('pluginResource', PluginCacheResource);
			},
		});
		const client = createBaseClient([plugin]);

		client.setServices({ cache: { disabledCache: { users: true } } });
		client.refreshPluginContributions();

		expect(client.cache.users).toBeUndefined();
		expect((client.cache as Cache & { pluginResource?: PluginCacheResource }).pluginResource).toBeInstanceOf(
			PluginCacheResource,
		);
	});

	test('notifies REST observers with readonly request payloads and isolates observer failures', async () => {
		const calls: unknown[] = [];
		const warn = vi.fn();
		const fetch = vi.fn(async () => new Response('{"ok":true}', { status: 200, headers: { 'content-type': 'json' } }));
		vi.stubGlobal('fetch', fetch);
		const bad = createPlugin({
			name: 'bad-rest',
			register(api) {
				api.rest.observe({
					onRequest() {
						throw new Error('observer failed');
					},
				});
			},
		});
		const good = createPlugin({
			name: 'good-rest',
			register(api) {
				api.rest.observe({
						onRequest(payload) {
							expect(() => ((payload.request.query as Record<string, unknown>).limit = 2)).toThrow();
							calls.push({
								client: payload.client,
								frozen: Object.isFrozen(payload),
								method: payload.method,
								requestFrozen: Object.isFrozen(payload.request),
								queryFrozen: Object.isFrozen(payload.request.query),
								url: payload.url,
							});
						},
						async onSuccess(payload) {
							calls.push({ body: await payload.response.text(), status: payload.response.status });
						},
					}, { order: PluginOrder.After });
				},
			});
		const client = createBaseClient([bad, good]);
		client.rest.debugger = { debug: vi.fn(), warn } as never;

		await client.rest.request('GET', '/users/@me', { auth: false, query: { limit: 1 } });

		expect(calls).toEqual([
			{
				client,
				frozen: true,
				method: 'GET',
				requestFrozen: true,
				queryFrozen: true,
				url: '/users/@me?limit=1',
			},
			{ body: '{"ok":true}', status: 200 },
		]);
		expect(warn).toHaveBeenCalledOnce();
	});

	test('runs hooks in order, supports disposers, and reports hook failures without skipping siblings', async () => {
		const calls: string[] = [];
		const errors: unknown[] = [];
		const warn = vi.fn();
		const plugin = createPlugin({
			name: 'hooks',
			register(api) {
				api.events.onError((error, name) => errors.push({ error, name }));
				api.hooks.tap('plugins:ready', () => calls.push('after'), { order: PluginOrder.After });
				api.hooks.tap('plugins:ready', () => calls.push('before'), { order: PluginOrder.Before });
				api.hooks.tap('plugins:ready', () => {
					throw new Error('hook failed');
				});
				const dispose = api.hooks.tap('plugins:ready', () => calls.push('disposed'));
				dispose();
			},
		});
		const client = createBaseClient([plugin]);
		client.logger = { warn } as never;

		await runPluginHooks(client, 'plugins:ready', client);

		expect(calls).toEqual(['before', 'after']);
		expect(errors).toEqual([
			expect.objectContaining({
				name: 'hook:plugins:ready',
				error: expect.objectContaining({
					name: 'SeyfertPluginError',
					plugin: 'hooks',
					phase: 'hook:plugins:ready',
				}),
			}),
		]);
		expect(warn).toHaveBeenCalledWith(
			'<Client>.hooks.onFail',
			expect.objectContaining({ plugin: 'hooks' }),
			'plugins:ready',
		);
	});

	test('fires lifecycle hook sites during start, reload, and close', async () => {
		const calls: string[] = [];
		const plugin = createPlugin({
			name: 'lifecycle-hooks',
			register(api) {
				api.hooks.on('plugins:setupComplete', () => calls.push('setup-complete'));
				api.hooks.tap('plugins:ready', () => calls.push('ready'));
				api.hooks.tap('commands:beforeLoad', (_client, dir) => calls.push(`before:${dir ?? ''}`));
				api.hooks.tap('commands:afterLoad', metadata => calls.push(`commands:${metadata.kind}`));
				api.hooks.tap('components:beforeLoad', (_client, dir) => calls.push(`components-before:${dir ?? ''}`));
				api.hooks.tap('components:afterLoad', metadata => calls.push(`components:${metadata.kind}`));
				api.hooks.tap('client:close', () => calls.push('close'));
			},
		});
		const client = createBaseClient([plugin]);
		client.loadCommands = async () => {};
		client.loadComponents = async () => {};

		await client.start({ commandsDir: 'commands' });
		await client.reloadPluginContributions();
		await client.close();

		expect(calls).toEqual([
			'setup-complete',
			'ready',
			'before:commands',
			'commands:commands',
			'components-before:',
			'components:components',
			'commands:commands',
			'components:components',
			'close',
		]);
	});

	test('rejects plugin contribution mutations during teardown', async () => {
		const plugin = createPlugin({
			name: 'teardown-mutator',
			teardown(_client, api) {
				(api as never as { commands: { add(command: typeof PluginPing): void } }).commands.add(PluginPing);
			},
		});
		const client = createBaseClient([plugin]);

		await client.start();

		await expect(client.close()).rejects.toMatchObject({
			errors: [
				expect.objectContaining({
					message: expect.stringMatching(/cannot mutate plugin contributions during teardown/),
				}),
			],
			name: 'SeyfertPluginAggregateError',
		});
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
