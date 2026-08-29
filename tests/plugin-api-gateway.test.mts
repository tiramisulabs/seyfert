import { describe, expect, test, vi } from 'vitest';
import {
	createPlugin,
	type GatewayDispatchPayload,
	GatewayOpcodes,
	type GatewaySendPayload,
	PluginOrder,
	WorkerClient,
} from '../src';
import { ShardManager } from '../src/websocket';
import {
	createGatewayClient,
	flushMicrotasks,
	gatewayInfo,
	installPluginApiTestCleanup,
	PluginCacheResource,
	runGatewayPacket,
	runtimeConfig,
	setWorkerData,
} from './plugin-api-fixtures';

installPluginApiTestCleanup();

describe('plugin api v3: gateway wrappers and dispatch', () => {
	test('wraps gateway send payloads through plugin hooks', async () => {
		const sent: GatewaySendPayload[] = [];
		const plugin = createPlugin({
			name: 'gateway-wrapper',
			register(api) {
				api.gateway.wrapSendPayload(({ payload }) => ({
					...payload,
					d: 'wrapped' as never,
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

	test('sends worker gateway payloads through plugin wrappers and the target shard', async () => {
		const sent: { force: boolean; payload: GatewaySendPayload }[] = [];
		const plugin = createPlugin({
			name: 'worker-gateway-wrapper',
			register(api) {
				api.gateway.wrapSendPayload(({ payload }) => ({
					...payload,
					d: 'wrapped' as never,
				}));
			},
		});
		const client = new WorkerClient({ getRC: runtimeConfig, plugins: [plugin], postMessage: () => {} });
		setWorkerData(client);
		client.shards.set(0, {
			send: async (force: boolean, payload: GatewaySendPayload) => {
				sent.push({ force, payload });
			},
		} as never);

		await expect(client.sendGatewayPayload(0, { op: GatewayOpcodes.Heartbeat, d: null })).resolves.toBe(true);

		expect(sent).toEqual([{ force: false, payload: { op: GatewayOpcodes.Heartbeat, d: 'wrapped' } }]);
	});

	test('resolves the current worker shard after asynchronous gateway wrappers finish', async () => {
		let releaseWrapper!: () => void;
		const wrapperBlocked = new Promise<void>(resolve => {
			releaseWrapper = resolve;
		});
		const plugin = createPlugin({
			name: 'worker-gateway-async-wrapper',
			register(api) {
				api.gateway.wrapSendPayload(async ({ payload }) => {
					await wrapperBlocked;
					return payload;
				});
			},
		});
		const client = new WorkerClient({ getRC: runtimeConfig, plugins: [plugin], postMessage: () => {} });
		setWorkerData(client);
		const oldSend = vi.fn(async () => {});
		const currentSend = vi.fn(async () => {});
		client.shards.set(0, { send: oldSend } as never);

		const sending = client.sendGatewayPayload(0, { op: GatewayOpcodes.Heartbeat, d: null });
		await flushMicrotasks();
		client.shards.set(0, { send: currentSend } as never);
		releaseWrapper();

		await expect(sending).resolves.toBe(true);
		expect(oldSend).not.toHaveBeenCalled();
		expect(currentSend).toHaveBeenCalledExactlyOnceWith(false, {
			op: GatewayOpcodes.Heartbeat,
			d: null,
		});
	});

	test('wraps manager-requested worker sends before forcing the current shard', async () => {
		const messages: unknown[] = [];
		const plugin = createPlugin({
			name: 'worker-manager-gateway-wrapper',
			register(api) {
				api.gateway.wrapSendPayload(({ payload }) => ({ ...payload, d: 'wrapped' as never }));
			},
		});
		const client = new WorkerClient({
			getRC: runtimeConfig,
			plugins: [plugin],
			postMessage: message => messages.push(message),
		});
		setWorkerData(client, 9);
		const sent = vi.fn(async () => {});
		client.shards.set(0, { send: sent } as never);

		await client.handleManagerMessages({
			type: 'SEND_PAYLOAD',
			shardId: 0,
			nonce: 'request-one',
			op: GatewayOpcodes.Heartbeat,
			d: null,
		});

		expect(sent).toHaveBeenCalledExactlyOnceWith(true, {
			op: GatewayOpcodes.Heartbeat,
			d: 'wrapped',
		});
		expect(messages).toEqual([{ type: 'RESULT_PAYLOAD', nonce: 'request-one', workerId: 9 }]);
	});

	test('logs and returns when a manager-requested worker shard disappears', async () => {
		const messages: unknown[] = [];
		const wrapper = vi.fn(({ payload }: { payload: GatewaySendPayload }) => payload);
		const client = new WorkerClient({
			getRC: runtimeConfig,
			plugins: [
				createPlugin({
					name: 'worker-manager-missing-shard',
					register(api) {
						api.gateway.wrapSendPayload(wrapper);
					},
				}),
			],
			postMessage: message => messages.push(message),
		});
		setWorkerData(client);
		const fatal = vi.spyOn(client.logger, 'fatal').mockImplementation(() => {});

		await expect(
			client.handleManagerMessages({
				type: 'SEND_PAYLOAD',
				shardId: 0,
				nonce: 'missing-shard',
				op: GatewayOpcodes.Heartbeat,
				d: null,
			}),
		).resolves.toBeUndefined();

		expect(wrapper).toHaveBeenCalledOnce();
		expect(fatal).toHaveBeenCalledExactlyOnceWith('Worker trying to send payload by non-existent shard (#0)');
		expect(messages).toEqual([]);
	});

	test('reports vetoed and unavailable worker gateway sends', async () => {
		const sent = vi.fn();
		const plugin = createPlugin({
			name: 'worker-gateway-veto',
			register(api) {
				api.gateway.wrapSendPayload(() => null);
			},
		});
		const client = new WorkerClient({ getRC: runtimeConfig, plugins: [plugin], postMessage: () => {} });
		setWorkerData(client);
		client.shards.set(0, { send: sent } as never);

		await expect(client.sendGatewayPayload(0, { op: GatewayOpcodes.Heartbeat, d: null })).resolves.toBe(false);
		expect(sent).not.toHaveBeenCalled();

		const availableWrapper = vi.fn(({ payload }: { payload: GatewaySendPayload }) => payload);
		const missingClient = new WorkerClient({
			getRC: runtimeConfig,
			plugins: [
				createPlugin({
					name: 'worker-gateway-missing-shard',
					register(api) {
						api.gateway.wrapSendPayload(availableWrapper);
					},
				}),
			],
			postMessage: () => {},
		});
		setWorkerData(missingClient);
		await expect(missingClient.sendGatewayPayload(1, { op: GatewayOpcodes.Heartbeat, d: null })).rejects.toMatchObject({
			code: 'INTERNAL_ERROR',
			metadata: expect.objectContaining({ detail: `Shard #1 doesn't exist` }),
		});
		expect(availableWrapper).toHaveBeenCalledOnce();
	});

	test('runs gateway dispatch interceptors before cache and events', async () => {
		const calls: string[] = [];
		const packets: GatewayDispatchPayload[] = [];
		const events: unknown[] = [];
		const plugin = createPlugin({
			name: 'gateway-dispatch',
			register(api) {
				api.cache.resource('pluginDispatchResource', PluginCacheResource, {
					onPacket(event) {
						packets.push(event);
					},
				});
				api.events.onAny((name, data, _client, shardId) => {
					if (name === 'PLUGIN_TEST_EVENT') events.push({ data, shardId });
				});
				api.gateway.onDispatch(
					(packet, next, meta) => {
						const data = packet.d as unknown as { value: string };
						calls.push(`before:${data.value}:${meta.shardId}`);
						return next({ ...packet, d: { value: 'middle' } as never });
					},
					{ order: PluginOrder.Before },
				);
				api.gateway.onDispatch(
					packet => {
						const data = packet.d as unknown as { value: string };
						calls.push(`after:${data.value}`);
						return { ...packet, d: { value: `${data.value}:after` } as never };
					},
					{ order: PluginOrder.After },
				);
			},
		});
		const client = createGatewayClient([plugin]);

		await runGatewayPacket(
			client,
			{ op: GatewayOpcodes.Dispatch, t: 'PLUGIN_TEST_EVENT', s: 1, d: { value: 'start' } } as never,
			7,
		);

		expect(calls).toEqual(['before:start:7', 'after:middle']);
		expect(packets).toEqual([
			expect.objectContaining({
				t: 'PLUGIN_TEST_EVENT',
				d: { value: 'middle:after' },
			}),
		]);
		expect(events).toEqual([{ data: { value: 'middle:after' }, shardId: 7 }]);
		expect(client.plugins.diagnostics[0]?.gatewayDispatchInterceptors).toBe(2);
	});

	test('lets gateway dispatch interceptors veto inbound packets', async () => {
		const packets: GatewayDispatchPayload[] = [];
		const events: string[] = [];
		const plugin = createPlugin({
			name: 'gateway-veto',
			register(api) {
				api.cache.resource('pluginDispatchVetoResource', PluginCacheResource, {
					onPacket(event) {
						packets.push(event);
					},
				});
				api.events.onAny(name => {
					events.push(name);
				});
				api.gateway.onDispatch(() => null);
			},
		});
		const client = createGatewayClient([plugin]);

		await runGatewayPacket(
			client,
			{ op: GatewayOpcodes.Dispatch, t: 'PLUGIN_TEST_EVENT', s: 1, d: { value: 'start' } } as never,
			7,
		);

		expect(packets).toEqual([]);
		expect(events).toEqual([]);
		expect(client.plugins.diagnostics[0]?.messages).toContainEqual(
			expect.objectContaining({
				phase: 'gateway.onDispatch',
				code: 'gateway-dispatch-veto',
				data: { shardId: 7, op: GatewayOpcodes.Dispatch, event: 'PLUGIN_TEST_EVENT' },
			}),
		);
	});

	test('keeps downstream gateway dispatch veto attribution when returning next', async () => {
		const first = createPlugin({
			name: 'first-gateway-dispatch-veto',
			register(api) {
				api.gateway.onDispatch((_packet, next) => next());
			},
		});
		const veto = createPlugin({
			name: 'downstream-gateway-dispatch-veto',
			register(api) {
				api.gateway.onDispatch(() => null);
			},
		});
		const client = createGatewayClient([first, veto]);

		await expect(
			runGatewayPacket(
				client,
				{ op: GatewayOpcodes.Dispatch, t: 'PLUGIN_TEST_EVENT', s: 1, d: { value: 'start' } } as never,
				7,
			),
		).resolves.toBeNull();

		expect(client.plugins.diagnostics[0]?.messages).toEqual([]);
		expect(client.plugins.diagnostics[1]?.messages).toEqual([
			expect.objectContaining({
				phase: 'gateway.onDispatch',
				code: 'gateway-dispatch-veto',
			}),
		]);
	});

	test('keeps downstream gateway dispatch veto sticky after await next', async () => {
		const packets: GatewayDispatchPayload[] = [];
		const events: string[] = [];
		const first = createPlugin({
			name: 'first-gateway-dispatch-sticky',
			register(api) {
				api.cache.resource('pluginDispatchStickyResource', PluginCacheResource, {
					onPacket(event) {
						packets.push(event);
					},
				});
				api.events.onAny(name => {
					events.push(name);
				});
				api.gateway.onDispatch(async (packet, next) => {
					await next(packet);
					return packet;
				});
			},
		});
		const veto = createPlugin({
			name: 'downstream-gateway-dispatch-sticky',
			register(api) {
				api.gateway.onDispatch(() => null);
			},
		});
		const client = createGatewayClient([first, veto]);

		await expect(
			runGatewayPacket(
				client,
				{ op: GatewayOpcodes.Dispatch, t: 'PLUGIN_TEST_EVENT', s: 1, d: { value: 'start' } } as never,
				7,
			),
		).resolves.toBeNull();

		expect(packets).toEqual([]);
		expect(events).toEqual([]);
		expect(client.plugins.diagnostics[0]?.messages).toEqual([]);
		expect(client.plugins.diagnostics[1]?.messages).toEqual([
			expect.objectContaining({
				phase: 'gateway.onDispatch',
				code: 'gateway-dispatch-veto',
			}),
		]);
	});

	test('sends transformed worker gateway dispatch packets to the parent', async () => {
		const messages: unknown[] = [];
		const plugin = createPlugin({
			name: 'worker-gateway-dispatch-transform',
			register(api) {
				api.gateway.onDispatch(packet => ({
					...packet,
					d: { value: 'worker' } as never,
				}));
			},
		});
		const client = new WorkerClient({
			getRC: runtimeConfig,
			plugins: [plugin],
			postMessage: body => messages.push(body),
			sendPayloadToParent: true,
		});
		setWorkerData(client, 9);
		const shard = client.createShard(0, { info: gatewayInfo(), compress: false });

		await shard.options.handlePayload(0, {
			op: GatewayOpcodes.Dispatch,
			t: 'PLUGIN_TEST_EVENT',
			s: 1,
			d: { value: 'start' },
		} as never);

		expect(messages).toEqual([
			{
				workerId: 9,
				shardId: 0,
				type: 'RECEIVE_PAYLOAD',
				payload: expect.objectContaining({
					t: 'PLUGIN_TEST_EVENT',
					d: { value: 'worker' },
				}),
			},
		]);
	});

	test('does not send vetoed worker gateway dispatch packets to the parent', async () => {
		const messages: unknown[] = [];
		const plugin = createPlugin({
			name: 'worker-gateway-dispatch-veto',
			register(api) {
				api.gateway.onDispatch(() => null);
			},
		});
		const client = new WorkerClient({
			getRC: runtimeConfig,
			plugins: [plugin],
			postMessage: body => messages.push(body),
			sendPayloadToParent: true,
		});
		setWorkerData(client, 9);
		const shard = client.createShard(0, { info: gatewayInfo(), compress: false });

		await shard.options.handlePayload(0, {
			op: GatewayOpcodes.Dispatch,
			t: 'PLUGIN_TEST_EVENT',
			s: 1,
			d: { value: 'start' },
		} as never);

		expect(messages).toEqual([]);
	});

	test('attributes gateway dispatch interceptor failures to the failing plugin', async () => {
		const first = createPlugin({
			name: 'first-gateway-dispatch',
			register(api) {
				api.gateway.onDispatch((_packet, next) => next());
			},
		});
		const bad = createPlugin({
			name: 'bad-gateway-dispatch',
			register(api) {
				api.gateway.onDispatch(() => {
					throw new Error('dispatch boom');
				});
			},
		});
		const client = createGatewayClient([first, bad]);

		await expect(
			runGatewayPacket(
				client,
				{ op: GatewayOpcodes.Dispatch, t: 'PLUGIN_TEST_EVENT', s: 1, d: { value: 'start' } } as never,
				7,
			),
		).rejects.toMatchObject({
			plugin: 'bad-gateway-dispatch',
			phase: 'gateway.onDispatch',
		});
	});
});
