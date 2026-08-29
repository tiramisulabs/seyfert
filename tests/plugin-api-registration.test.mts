import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, test, vi } from 'vitest';
import {
	Command,
	ComponentCommand,
	createPlugin,
	createPluginFactory,
	definePlugins,
	GatewayIntentBits,
	ModalCommand,
	type PluginHandlerTransformer,
	WorkerClient,
} from '../src';
import { BaseClient } from '../src/client/base';
import {
	createBaseClient,
	DuplicatePing,
	gatewayInfo,
	HandlerButton,
	HandlerCommand,
	HandlerInstanceButton,
	HandlerInstanceCommand,
	HandlerInstanceModal,
	HandlerModal,
	installPluginApiTestCleanup,
	LoadedHandlerButton,
	LoadedHandlerCommand,
	LoadedHandlerModal,
	PluginButton,
	PluginModal,
	PluginPing,
	runtimeConfig,
	tempDirs,
} from './plugin-api-fixtures';

installPluginApiTestCleanup();

describe('plugin api v3: registration and handler contributions', () => {
	test('defines a canonical plugin tuple from rest arguments or an array', () => {
		const storage = createPlugin({ name: 'storage' });
		const economy = createPlugin({ name: 'economy', imports: [storage] });

		expect(definePlugins(economy, storage)).toEqual([economy, storage]);
		expect(definePlugins([economy, storage])).toEqual([economy, storage]);
		expect(definePlugins()).toEqual([]);
	});

	test('wraps createPluginFactory factory errors with attribution', () => {
		const factory = createPluginFactory({
			defaults: { enabled: false },
			factory: () => {
				throw new Error('invalid config');
			},
		});

		expect(() => factory({ enabled: true })).toThrow(/createPluginFactory.*options|options.*createPluginFactory/);
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
			setup: (() => calls.push('setup parent')) as () => void,
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
				api?.gateway.wrapSendPayload(({ payload }) => payload);
				api?.gateway.onDispatch((packet, next) => next(packet));
			},
		});
		const client = createBaseClient([plugin]);

		await client.start();

		expect(client.options.allowedMentions).toEqual({ parse: [] });
		expect(client.options.commands?.defaults?.props).toEqual({ fromSetup: true });
		expect(client.cache.intents & GatewayIntentBits.Guilds).toBe(GatewayIntentBits.Guilds);
		expect(client.pluginRegistry.autocompleteWrappers).toHaveLength(1);
		expect(client.pluginRegistry.gatewaySendPayloadWrappers).toHaveLength(1);
		expect(client.pluginRegistry.gatewayDispatchInterceptors).toHaveLength(1);
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
				api?.gateway.wrapSendPayload(({ payload }) => payload);
				api?.gateway.onDispatch((packet, next) => next(packet));
				throw new Error('setup boom');
			},
		});
		const client = createBaseClient([plugin]);

		await expect(client.start()).rejects.toThrow(/setup boom/);

		expect(client.options.allowedMentions).toBeUndefined();
		expect(client.options.commands?.defaults?.props).toBeUndefined();
		expect(client.cache.intents & GatewayIntentBits.Guilds).toBe(0);
		expect(client.pluginRegistry.autocompleteWrappers).toHaveLength(0);
		expect(client.pluginRegistry.gatewaySendPayloadWrappers).toHaveLength(0);
		expect(client.pluginRegistry.gatewayDispatchInterceptors).toHaveLength(0);
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
				api.handlers.transform(
					command => {
						if (command instanceof Command) command.name = 'renamed-plugin-ping';
						return command;
					},
					{ kinds: ['command'] },
				);
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

		expect(uploaded).toEqual([{ applicationId: 'app', data: { body: [] }, guildId: 'guild-1', scope: 'guild' }]);
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
				api.handlers.construct((_constructor, next, metadata) => {
					createKinds.push(metadata.kind);
					return next();
				});
				api.handlers.transform(((
					instance: { name?: string; customId?: string | RegExp; props?: Record<string, unknown> },
					metadata,
				) => {
					transformed.push(`${metadata.kind}:${'name' in instance ? instance.name : instance.customId}`);
					instance.props ??= {};
					instance.props.handlerKind = metadata.kind;
				}) as PluginHandlerTransformer);
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
		expect(
			(
				client.commands.values.find(command => command.name === 'handler-command') as
					| { props: { handlerKind?: string } }
					| undefined
			)?.props.handlerKind,
		).toBe('command');
		expect(client.commands.values.find(command => command.name === 'handler-instance-command')).toBe(commandInstance);
		expect(
			(
				client.components.commands.find(component => component.customId === 'handler-button') as
					| { props: { handlerKind?: string } }
					| undefined
			)?.props.handlerKind,
		).toBe('component');
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
						api.handlers.construct((_constructor, next) => next(), { kinds: ['commands' as never] });
					},
				}),
			]),
		).toThrow(/Handler kind "commands" is invalid/);
	});

	test('rejects the event kind on handlers.construct', () => {
		expect(() =>
			createBaseClient([
				createPlugin({
					name: 'bad-event-construct',
					register(api) {
						api.handlers.construct((_constructor, next) => next(), { kinds: ['event'] });
					},
				}),
			]),
		).toThrow(/Events have no construction step/);
	});

	test('normalizes loaded events through handlers.transform with kinds:["event"]', () => {
		const kinds: string[] = [];
		class InjectableEvent {
			run() {
				return 'di';
			}
		}
		const plugin = createPlugin({
			name: 'event-transform',
			register(api) {
				api.handlers.transform(
					(loaded, metadata) => {
						kinds.push(metadata.kind);
						if (metadata.kind === 'event' && typeof loaded === 'function') {
							return { data: { name: 'messageCreate' }, run: () => undefined } as never;
						}
					},
					{ kinds: ['event'] },
				);
			},
		});
		const client = createBaseClient([plugin]);
		const result = client.runPluginHandlerTransformers('event', InjectableEvent) as {
			data?: { name?: string };
			run?: unknown;
		};

		expect(kinds).toEqual(['event']);
		expect(typeof result.run).toBe('function');
		expect(result.data?.name).toBe('messageCreate');
	});

	test('applies unified handler creators and transformers to file-loaded handlers', async () => {
		const createKinds: string[] = [];
		const transformed: string[] = [];
		const plugin = createPlugin({
			name: 'loaded-handlers',
			register(api) {
				api.handlers.construct((_constructor, next, metadata) => {
					createKinds.push(metadata.kind);
					return next();
				});
				api.handlers.transform(((
					instance: { name?: string; customId?: string | RegExp; props?: Record<string, unknown> },
					metadata,
				) => {
					transformed.push(`${metadata.kind}:${'name' in instance ? instance.name : instance.customId}`);
					instance.props ??= {};
					instance.props.handlerKind = metadata.kind;
				}) as PluginHandlerTransformer);
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
		vi.spyOn(client.commands as unknown as { getFiles: () => Promise<string[]> }, 'getFiles').mockResolvedValue([
			'/commands/loaded-command.js',
		]);
		vi.spyOn(
			client.commands as unknown as {
				loadFilesK: () => Promise<{ name: string; path: string; file: { default: unknown } }[]>;
			},
			'loadFilesK',
		).mockResolvedValue([
			{
				name: 'loaded-command.js',
				path: '/commands/loaded-command.js',
				file: { default: LoadedHandlerCommand },
			},
		]);
		vi.spyOn(client.components as unknown as { getFiles: () => Promise<string[]> }, 'getFiles').mockResolvedValue([
			'/components/loaded-button.js',
			'/components/loaded-modal.js',
		]);
		vi.spyOn(
			client.components as unknown as {
				loadFilesK: () => Promise<{ name: string; path: string; file: { default: unknown } }[]>;
			},
			'loadFilesK',
		).mockResolvedValue([
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
		expect(
			(
				client.commands.values.find(command => command.name === 'loaded-handler-command') as
					| { props: { handlerKind?: string } }
					| undefined
			)?.props.handlerKind,
		).toBe('command');
		expect(
			(
				client.components.commands.find(component => component.customId === 'loaded-handler-button') as
					| { props: { handlerKind?: string } }
					| undefined
			)?.props.handlerKind,
		).toBe('component');
		expect(
			(
				client.components.commands.find(component => component.customId === 'loaded-handler-modal') as
					| { props: { handlerKind?: string } }
					| undefined
			)?.props.handlerKind,
		).toBe('modal');
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
				api.handlers.transform(((
					instance: { name?: string; customId?: string | RegExp; props?: Record<string, unknown> },
					metadata,
				) => {
					transformed.push(metadata.kind);
					instance.props ??= {};
					instance.props.reloadKind = metadata.kind;
				}) as PluginHandlerTransformer);
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
		expect((client.commands.values[0] as { props: { reloadKind?: string } } | undefined)?.props.reloadKind).toBe(
			'command',
		);
		expect(
			(
				client.components.commands.find(component => component.customId === 'reload-button') as
					| { props: { reloadKind?: string } }
					| undefined
			)?.props.reloadKind,
		).toBe('component');
		expect(
			(
				client.components.commands.find(component => component.customId === 'reload-modal') as
					| { props: { reloadKind?: string } }
					| undefined
			)?.props.reloadKind,
		).toBe('modal');
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
		vi.spyOn(client.langs as unknown as { getFiles: () => Promise<string[]> }, 'getFiles').mockResolvedValue([
			langPath,
		]);
		vi.spyOn(
			client.langs as unknown as {
				loadFilesK: () => Promise<{ name: string; path: string; file: { default: Record<string, string> } }[]>;
			},
			'loadFilesK',
		).mockResolvedValue([
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
});
