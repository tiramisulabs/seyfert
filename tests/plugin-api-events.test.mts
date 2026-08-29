import { describe, expect, test, vi } from 'vitest';
import {
	BaseCommand,
	createMiddleware,
	createPlugin,
	GatewayIntentBits,
	GatewayOpcodes,
	type MiddlewareContext,
	PluginOrder,
	runPluginCommandObservers,
} from '../src';
import { resolveRawEventData } from '../src/events/utils';
import {
	createBaseClient,
	createGatewayClient,
	DuplicatePing,
	flushMicrotasks,
	installPluginApiTestCleanup,
	PluginCacheResource,
	PluginPing,
} from './plugin-api-fixtures';

installPluginApiTestCleanup();

describe('plugin api v3: events, middleware, and requirements', () => {
	test('retries once custom events after their run fails', async () => {
		const failures: unknown[] = [];
		let attempts = 0;
		const client = createGatewayClient();
		client.events.onFail = async (_name, error) => failures.push(error);
		client.events.set([
			{
				data: { name: 'commandsLoaded', once: true },
				run() {
					attempts++;
					if (attempts === 1) throw new Error('custom boom');
				},
			},
		]);

		await client.events.runCustom('commandsLoaded', {
			kind: 'commands',
			total: 0,
			items: [],
			plugin: { total: 0, sources: {} },
		});
		await client.events.runCustom('commandsLoaded', {
			kind: 'commands',
			total: 0,
			items: [],
			plugin: { total: 0, sources: {} },
		});

		expect(attempts).toBe(2);
		expect(failures).toHaveLength(1);
	});

	test('reserves once custom events while their run is unresolved', async () => {
		const failures: unknown[] = [];
		let attempts = 0;
		let release!: () => void;
		const holdRun = new Promise<void>(resolve => {
			release = resolve;
		});
		const client = createGatewayClient();
		client.events.onFail = async (_name, error) => failures.push(error);
		client.events.set([
			{
				data: { name: 'commandsLoaded', once: true },
				run() {
					attempts++;
					return holdRun;
				},
			},
		]);

		const firstDispatch = client.events.runCustom('commandsLoaded', {
			kind: 'commands',
			total: 0,
			items: [],
			plugin: { total: 0, sources: {} },
		});
		const secondDispatch = client.events.runCustom('commandsLoaded', {
			kind: 'commands',
			total: 0,
			items: [],
			plugin: { total: 0, sources: {} },
		});

		await flushMicrotasks();
		expect(attempts).toBe(1);

		release();
		await Promise.all([firstDispatch, secondDispatch]);

		expect(attempts).toBe(1);
		expect(failures).toHaveLength(0);
	});

	test('retries once gateway events after their run fails', async () => {
		const failures: unknown[] = [];
		let attempts = 0;
		const client = createGatewayClient();
		client.events.onFail = async (_name, error) => failures.push(error);
		client.events.set([
			{
				data: { name: 'botReady', once: true },
				run() {
					attempts++;
					if (attempts === 1) throw new Error('gateway boom');
				},
			},
		]);

		await client.events.runEvent('BOT_READY' as never, client, {} as never, -1, false);
		await client.events.runEvent('BOT_READY' as never, client, {} as never, -1, false);

		expect(attempts).toBe(2);
		expect(failures).toHaveLength(1);
	});

	test('reserves once gateway events while their run is unresolved', async () => {
		const failures: unknown[] = [];
		let attempts = 0;
		let release!: () => void;
		const holdRun = new Promise<void>(resolve => {
			release = resolve;
		});
		const client = createGatewayClient();
		client.events.onFail = async (_name, error) => failures.push(error);
		client.events.set([
			{
				data: { name: 'botReady', once: true },
				run() {
					attempts++;
					return holdRun;
				},
			},
		]);

		const firstDispatch = client.events.runEvent('BOT_READY' as never, client, {} as never, -1, false);
		const secondDispatch = client.events.runEvent('BOT_READY' as never, client, {} as never, -1, false);

		await flushMicrotasks();
		expect(attempts).toBe(1);

		release();
		await Promise.all([firstDispatch, secondDispatch]);

		expect(attempts).toBe(1);
		expect(failures).toHaveLength(0);
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
		const audit: MiddlewareContext = ({ stop }) => stop();
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

	test('treats stop() / stop(null) / stop(undefined) as pass', async () => {
		const passNoArg = createMiddleware<void>(({ stop }) => stop());
		const passNull = createMiddleware<void>(({ stop }) => stop(null));
		const passUndefined = createMiddleware<void>(({ stop }) => stop(undefined));
		const context = {
			client: {
				middlewares: { passNoArg, passNull, passUndefined },
				logger: { warn: vi.fn() },
			},
			command: { name: 'secure' },
			globalMetadata: {},
			metadata: {},
		} as never;

		await expect(BaseCommand.__runMiddlewares(context, ['passNoArg' as never], false)).resolves.toEqual({
			pass: true,
		});
		await expect(BaseCommand.__runMiddlewares(context, ['passNull' as never], false)).resolves.toEqual({
			pass: true,
		});
		await expect(BaseCommand.__runMiddlewares(context, ['passUndefined' as never], false)).resolves.toEqual({
			pass: true,
		});
	});

	test('rejects the runner promise when an async middleware rejects', async () => {
		const error = new Error('async denied');
		const asyncReject = createMiddleware<void>(() => Promise.reject(error));
		const logger = { error: vi.fn(), warn: vi.fn() };
		const context = {
			client: {
				middlewares: {
					asyncReject,
				},
				logger,
			},
			command: { name: 'secure' },
			globalMetadata: {},
			metadata: {},
		} as never;

		// An exception (async rejection) is an internal error, not a denial: it rejects the
		// runner so it lands on onInternalError, identical to a synchronous throw.
		await expect(BaseCommand.__runMiddlewares(context, ['asyncReject' as never], false)).rejects.toBe(error);
		expect(logger.error).not.toHaveBeenCalled();
	});

	test('keeps synchronous middleware throws as rejected runner promises', async () => {
		const syncThrow = createMiddleware<void>(() => {
			throw new Error('sync failed');
		});
		const logger = { error: vi.fn(), warn: vi.fn() };
		const context = {
			client: {
				middlewares: {
					syncThrow,
				},
				logger,
			},
			command: { name: 'secure' },
			globalMetadata: {},
			metadata: {},
		} as never;

		await expect(BaseCommand.__runMiddlewares(context, ['syncThrow' as never], false)).rejects.toThrow('sync failed');
		expect(logger.error).not.toHaveBeenCalled();
	});

	test('keeps synchronous throws from middleware invoked after async next as rejected runner promises', async () => {
		const asyncNext = createMiddleware<void>(async ({ next }) => {
			await Promise.resolve();
			next();
		});
		const syncThrow = createMiddleware<void>(() => {
			throw new Error('sync failed after async next');
		});
		const logger = { error: vi.fn(), warn: vi.fn() };
		const context = {
			client: {
				middlewares: {
					asyncNext,
					syncThrow,
				},
				logger,
			},
			command: { name: 'secure' },
			globalMetadata: {},
			metadata: {},
		} as never;

		await expect(
			BaseCommand.__runMiddlewares(context, ['asyncNext' as never, 'syncThrow' as never], false),
		).rejects.toThrow('sync failed after async next');
		expect(logger.error).not.toHaveBeenCalled();
	});

	test('keeps synchronous throws from callback-scheduled next as rejected runner promises', async () => {
		const callbackNext = createMiddleware<void>(({ next }) => {
			setTimeout(next, 0);
		});
		const syncThrow = createMiddleware<void>(() => {
			throw new Error('sync failed after callback next');
		});
		const logger = { error: vi.fn(), warn: vi.fn() };
		const context = {
			client: {
				middlewares: {
					callbackNext,
					syncThrow,
				},
				logger,
			},
			command: { name: 'secure' },
			globalMetadata: {},
			metadata: {},
		} as never;

		await expect(
			BaseCommand.__runMiddlewares(context, ['callbackNext' as never, 'syncThrow' as never], false),
		).rejects.toThrow('sync failed after callback next');
		expect(logger.error).not.toHaveBeenCalled();
	});

	test('rejects with the async error even after next has advanced', async () => {
		const error = new Error('auth failed late');
		let rejectAuth!: (error: Error) => void;
		const auth = createMiddleware<void>(({ next }) => {
			next();
			return new Promise((_resolve, reject) => {
				rejectAuth = reject;
			});
		});
		const audit = createMiddleware<void>(() => undefined);
		const logger = { error: vi.fn(), warn: vi.fn() };
		const context = {
			client: {
				middlewares: {
					auth,
					audit,
				},
				logger,
			},
			command: { name: 'secure' },
			globalMetadata: {},
			metadata: {},
		} as never;

		const result = BaseCommand.__runMiddlewares(context, ['auth' as never, 'audit' as never], false);
		rejectAuth(error);

		// Even though `auth` already called next(), its later rejection still rejects the runner
		// (the chain had not resolved) and surfaces the original error to onInternalError.
		await expect(result).rejects.toBe(error);
		expect(logger.error).not.toHaveBeenCalled();
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

		await runPluginCommandObservers(client, 'onMiddlewaresError', {} as never, 'denied', {
			middleware: 'auth',
			scope: 'global',
		});

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

		await client.start({ connection: { intents: ['GuildMessages'] } }, false);

		expect(client.cache.intents & GatewayIntentBits.GuildMessages).toBe(GatewayIntentBits.GuildMessages);
		expect(client.cache.intents & GatewayIntentBits.Guilds).toBe(GatewayIntentBits.Guilds);
		expect(client.cache.intents & GatewayIntentBits.GuildMembers).toBe(GatewayIntentBits.GuildMembers);
	});

	test('diagnoses invalid gateway intent strings without registering undefined bits', () => {
		const plugin = createPlugin({
			name: 'bad-intents',
			register(api) {
				api.gateway.addIntents('NotAnIntent' as never, 'Guilds');
				api.cache.resource('intentCache', PluginCacheResource, { intents: ['StillNotAnIntent' as never] });
			},
		});
		const client = createBaseClient([plugin]);

		expect(client.cache.intents & GatewayIntentBits.Guilds).toBe(GatewayIntentBits.Guilds);
		expect(client.plugins.diagnostics[0]?.messages).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					code: 'unknown-intent-bits',
					phase: 'gateway.addIntents',
				}),
				expect.objectContaining({
					code: 'unknown-intent-bits',
					phase: 'cache.resource',
				}),
			]),
		);
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
});
