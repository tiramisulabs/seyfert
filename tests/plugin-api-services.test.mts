import { describe, expect, test, vi } from 'vitest';
import {
	ApiHandler,
	type ApiRequestOptions,
	BaseResource,
	Cache,
	createPlugin,
	createSharedKey,
	type GatewayDispatchPayload,
	GatewayOpcodes,
	PluginOrder,
	runPluginHooks,
} from '../src';
import {
	createBaseClient,
	createGatewayClient,
	installPluginApiTestCleanup,
	PluginCacheResource,
	PluginPing,
} from './plugin-api-fixtures';

installPluginApiTestCleanup();

describe('plugin api v3: shared services, cache, REST, and lifecycle', () => {
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
		await client.cache.onPacket({ t: 'RESUMED', op: GatewayOpcodes.Dispatch, s: 1, d: {} } as never);

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

	test('validates all plugin cache names against the runtime surface before constructing resources', () => {
		let constructions = 0;
		class CountingPluginResource extends BaseResource {
			constructor(...args: ConstructorParameters<typeof BaseResource>) {
				super(...args);
				constructions++;
			}
		}
		Object.defineProperty(Cache.prototype, 'futureRuntimeResource', {
			configurable: true,
			value: true,
		});
		try {
			expect(() =>
				createBaseClient([
					createPlugin({
						name: 'runtime-cache-conflict',
						register(api) {
							api.cache.resource('constructedFirst', CountingPluginResource);
							api.cache.resource('futureRuntimeResource', CountingPluginResource);
						},
					}),
				]),
			).toThrow(/futureRuntimeResource.*Cache runtime surface/);
		} finally {
			delete (Cache.prototype as { futureRuntimeResource?: unknown }).futureRuntimeResource;
		}

		expect(constructions).toBe(0);
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

		await client.cache.onPacket({ t: 'RESUMED', op: GatewayOpcodes.Dispatch, s: 1, d: {} } as never);

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

	test('does not create REST observer payloads when no observers are registered', async () => {
		const fetch = vi.fn(
			async () => new Response('{"ok":true}', { status: 200, headers: { 'content-type': 'application/json' } }),
		);
		vi.stubGlobal('fetch', fetch);
		const api = new ApiHandler({ token: 'token' });
		vi.spyOn(api, 'parseRequest').mockReturnValue({ data: undefined, finalUrl: '/users/@me' });
		const body = Object.defineProperty({}, 'content', {
			enumerable: true,
			get() {
				throw new Error('observer payload should not clone request body');
			},
		});
		const request = { auth: false, body } satisfies ApiRequestOptions;

		await expect(api.request('GET', '/users/@me', request)).resolves.toEqual({ ok: true });
		expect(fetch).toHaveBeenCalledOnce();
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
				api.rest.observe(
					{
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
					},
					{ order: PluginOrder.After },
				);
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

	test('runs direct REST observers after plugins before legacy callbacks', async () => {
		const calls: string[] = [];
		const warn = vi.fn();
		const fetch = vi.fn(async () => new Response('{"ok":true}', { status: 200, headers: { 'content-type': 'json' } }));
		vi.stubGlobal('fetch', fetch);
		const plugin = createPlugin({
			name: 'plugin-rest',
			register(api) {
				api.rest.observe({
					onRequest(payload) {
						calls.push(`plugin-request:${Object.isFrozen(payload)}`);
					},
					onSuccess() {
						calls.push('plugin-success');
					},
				});
			},
		});
		const client = createBaseClient([plugin]);
		client.rest.debugger = { debug: vi.fn(), warn } as never;
		client.rest.onSuccessRequest = () => {
			calls.push('legacy-success');
		};
		const disposeRemoved = client.rest.observe({
			onRequest() {
				calls.push('removed');
			},
		});
		disposeRemoved();
		disposeRemoved();
		client.rest.observe({
			onRequest(payload) {
				calls.push(`direct-request:${payload.client === client}:${Object.isFrozen(payload.request)}`);
			},
			onSuccess() {
				calls.push('direct-success');
			},
		});
		client.rest.observe({
			onSuccess() {
				calls.push('direct-bad');
				throw new Error('direct observer failed');
			},
		});

		await client.rest.request('GET', '/users/@me', { auth: false, query: { limit: 1 } });

		expect(calls).toEqual([
			'plugin-request:true',
			'direct-request:true:true',
			'plugin-success',
			'direct-success',
			'direct-bad',
			'legacy-success',
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
				api.hooks.on('plugins:ready', () => calls.push('after'), { order: PluginOrder.After });
				api.hooks.on('plugins:ready', () => calls.push('before'), { order: PluginOrder.Before });
				api.hooks.on('plugins:ready', () => {
					throw new Error('hook failed');
				});
				const dispose = api.hooks.on('plugins:ready', () => calls.push('disposed'));
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
				api.hooks.on('plugins:ready', () => calls.push('ready'));
				api.hooks.on('commands:beforeLoad', (_client, dir) => calls.push(`before:${dir ?? ''}`));
				api.hooks.on('commands:afterLoad', metadata => calls.push(`commands:${metadata.kind}`));
				api.hooks.on('components:beforeLoad', (_client, dir) => calls.push(`components-before:${dir ?? ''}`));
				api.hooks.on('components:afterLoad', metadata => calls.push(`components:${metadata.kind}`));
				api.hooks.on('client:close', () => calls.push('close'));
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
