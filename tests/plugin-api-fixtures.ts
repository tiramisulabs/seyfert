import { rm } from 'node:fs/promises';
import { afterEach, vi } from 'vitest';
import {
	BaseResource,
	Client,
	Command,
	ComponentCommand,
	type GatewayDispatchPayload,
	ModalCommand,
	type WorkerClient,
} from '../src';
import { BaseClient } from '../src/client/base';

export function runtimeConfig() {
	return {
		token: Buffer.from('bot').toString('base64'),
		locations: { base: '' },
		intents: 0,
	};
}

export function gatewayInfo() {
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

export function createBaseClient(plugins = [] as NonNullable<ConstructorParameters<typeof BaseClient>[0]>['plugins']) {
	return new BaseClient({ getRC: runtimeConfig, plugins });
}

export function createGatewayClient(plugins = [] as NonNullable<ConstructorParameters<typeof Client>[0]>['plugins']) {
	const client = new Client({ getRC: runtimeConfig, plugins });
	(client as unknown as { gateway: unknown }).gateway = {};
	return client;
}

export async function flushMicrotasks(count = 3) {
	for (let i = 0; i < count; i++) await Promise.resolve();
}

export function runGatewayPacket(client: Client, packet: GatewayDispatchPayload, shardId = 0) {
	return (
		client as unknown as {
			onPacket(shardId: number, packet: GatewayDispatchPayload): Promise<GatewayDispatchPayload | null>;
		}
	).onPacket(shardId, packet);
}

export function setWorkerData(client: WorkerClient, workerId = 1) {
	client.setWorkerData({
		compress: false,
		debug: false,
		info: gatewayInfo(),
		intents: 0,
		mode: 'custom',
		path: '',
		resharding: false,
		shards: [],
		token: 'token',
		totalShards: 1,
		totalWorkers: 1,
		workerId,
		workerProxy: false,
	});
}

export class PluginPing extends Command {
	name = 'plugin-ping';
	description = 'Plugin ping';
	run() {}
}

export class DuplicatePing extends Command {
	name = 'plugin-ping';
	description = 'Duplicate ping';
	run() {}
}

export class PluginButton extends ComponentCommand {
	componentType = 'Button' as const;
	customId = 'plugin-button';
	run() {}
}

export class PluginModal extends ModalCommand {
	customId = 'plugin-modal';
	run() {}
}

export class HandlerCommand extends Command {
	name = 'handler-command';
	description = 'Handler command';
	run() {}
}

export class HandlerInstanceCommand extends Command {
	name = 'handler-instance-command';
	description = 'Handler instance command';
	run() {}
}

export class HandlerButton extends ComponentCommand {
	componentType = 'Button' as const;
	customId = 'handler-button';
	run() {}
}

export class HandlerInstanceButton extends ComponentCommand {
	componentType = 'Button' as const;
	customId = 'handler-instance-button';
	run() {}
}

export class HandlerModal extends ModalCommand {
	customId = 'handler-modal';
	run() {}
}

export class HandlerInstanceModal extends ModalCommand {
	customId = 'handler-instance-modal';
	run() {}
}

export class LoadedHandlerCommand extends Command {
	name = 'loaded-handler-command';
	description = 'Loaded handler command';
	run() {}
}

export class LoadedHandlerButton extends ComponentCommand {
	componentType = 'Button' as const;
	customId = 'loaded-handler-button';
	run() {}
}

export class LoadedHandlerModal extends ModalCommand {
	customId = 'loaded-handler-modal';
	run() {}
}

export class PluginCacheResource extends BaseResource<{ id: string }, { id: string }> {
	namespace = 'plugin-resource';
}

export const tempDirs: string[] = [];

export function installPluginApiTestCleanup() {
	afterEach(async () => {
		vi.restoreAllMocks();
		vi.unstubAllGlobals();
		await Promise.all(tempDirs.splice(0).map(dir => rm(dir, { recursive: true, force: true })));
		delete (globalThis as { __SeyfertReloadCommandBase?: unknown }).__SeyfertReloadCommandBase;
		delete (globalThis as { __SeyfertReloadComponentBase?: unknown }).__SeyfertReloadComponentBase;
		delete (globalThis as { __SeyfertReloadModalBase?: unknown }).__SeyfertReloadModalBase;
	});
}
