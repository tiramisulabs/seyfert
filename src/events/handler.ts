import type { Client, WorkerClient } from '../client';
import type { BaseClient } from '../client/base';
import { wrapPluginError } from '../client/plugins/errors';
import { orderedPluginContributions } from '../client/plugins/order';
import type { UsingClient } from '../commands';
import type { FileLoaded } from '../commands/handler';
import {
	type Awaitable,
	BaseHandler,
	type CamelCase,
	isCloudfareWorker,
	type MakeRequired,
	magicImport,
	ReplaceRegex,
	SeyfertError,
	type SnakeCase,
} from '../common';
import type { ClientEvents } from '../events/hooks';
import * as RawEvents from '../events/hooks';
import { normalizeEventName, resolveRawEventData } from '../events/utils';
import { type APIThreadChannel, ChannelType, type GatewayDispatchPayload } from '../types';
import type { ClientEvent, ClientNameEvents, CustomEvents, CustomEventsKeys, EventContext } from './event';

export type EventValue = MakeRequired<ClientEvent, '__filePath'> & {
	fired?: boolean;
};
export type GatewayEvents = Uppercase<SnakeCase<keyof ClientEvents>>;

export type ResolveEventParams<T extends ClientNameEvents | CustomEventsKeys | GatewayEvents> =
	T extends CustomEventsKeys
		? [...Parameters<CustomEvents[T]>, UsingClient]
		: T extends GatewayEvents
			? EventContext<{ data: { name: CamelCase<T> } }>
			: T extends ClientNameEvents
				? EventContext<{ data: { name: T } }>
				: never;

export type ResolveEventRunParams<T extends ClientNameEvents | CustomEventsKeys | GatewayEvents> =
	T extends CustomEventsKeys
		? Parameters<CustomEvents[T]>
		: T extends GatewayEvents
			? EventContext<{ data: { name: CamelCase<T> } }>
			: T extends ClientNameEvents
				? EventContext<{ data: { name: T } }>
				: never;

export type EventValues = {
	[K in CustomEventsKeys | GatewayEvents]: Omit<EventValue, 'run'> & {
		run(...args: ResolveEventRunParams<K>): any;
	};
};

export interface CustomEventRunner {
	runCustom<T extends CustomEventsKeys>(name: T, ...args: ResolveEventRunParams<T>): Awaitable<void>;
}

type PluginEventListener = {
	record: {
		plugin: { name: string };
		index: number;
	};
	name: string;
	handler: (...args: unknown[]) => unknown;
	active: boolean;
	once?: boolean;
	fired?: boolean;
};

type PluginAnyEventListener = {
	record: {
		plugin: { name: string };
		index: number;
	};
	handler: (name: string, ...args: unknown[]) => unknown;
	active: boolean;
};

type ClientWithPluginRegistry = BaseClient;

export class CustomEventHandler extends BaseHandler implements CustomEventRunner {
	constructor(protected client: ClientWithPluginRegistry) {
		super(client.logger);
	}

	onFail = (event: GatewayEvents | CustomEventsKeys | string, err: unknown) =>
		this.logger.warn('<Client>.events.onFail', err, event);

	values: Partial<EventValues> = {};

	async runCustom<T extends CustomEventsKeys>(name: T, ...args: ResolveEventRunParams<T>) {
		const listeners = this.getPluginListeners(name);
		const anyListeners = this.getPluginAnyListeners();
		const Event = this.values[name];
		try {
			if ((!Event || (Event.data.once && Event.fired)) && !listeners.length && !anyListeners.length) {
				await this.runCollectors(name, args);
				return;
			}
			this.client.debugger?.debug(`executed a custom event [${name}]`, Event?.data.once ? 'once' : '');

			const tasks: Promise<unknown>[] = [];
			const collectors = this.runCollectors(name, args);
			if (collectors) tasks.push(Promise.resolve(collectors));
			if (Event && !(Event.data.once && Event.fired)) {
				Event.fired = true;
				tasks.push(Promise.resolve((Event.run as any)(...args, this.client)));
			}
			tasks.push(...this.createPluginListenerTasks(name, listeners, anyListeners, [...args, this.client]));
			await this.settleEventTasks(name, tasks);
		} catch (e) {
			await this.reportEventFailure(name, e);
		}
	}

	protected getPluginListeners(name: string) {
		const normalized = normalizeEventName(name);
		return (
			orderedPluginContributions(
				(this.client.pluginRegistry?.events ?? []).filter(
					listener => listener.active && normalizeEventName(listener.name) === normalized,
				),
			) ?? []
		);
	}

	protected getPluginAnyListeners() {
		return orderedPluginContributions(
			(this.client.pluginRegistry?.anyEvents ?? []).filter(listener => listener.active),
		);
	}

	protected getPluginErrorListeners() {
		return orderedPluginContributions(
			(this.client.pluginRegistry?.eventErrors ?? []).filter(listener => listener.active),
		);
	}

	protected runCollectors(name: string, args: unknown) {
		return (
			this.client as BaseClient & {
				collectors?: { run(name: never, args: unknown, client: never): Awaitable<unknown> };
			}
		).collectors?.run(name as never, args, this.client as never);
	}

	// Plugin listeners are additive: build isolated tasks so one failure is attributed without skipping the rest.
	protected createPluginListenerTasks(
		name: string,
		listeners: readonly PluginEventListener[],
		anyListeners: readonly PluginAnyEventListener[],
		args: readonly unknown[],
	) {
		const tasks: Promise<unknown>[] = [];
		for (const listener of listeners) {
			if (listener.once && listener.fired) continue;
			listener.fired = true;
			tasks.push(
				Promise.resolve()
					.then(() => listener.handler(...args))
					.catch(error => {
						throw wrapPluginError(listener.record.plugin.name, `event:${name}`, listener.record.index, error);
					}),
			);
		}
		for (const listener of anyListeners) {
			tasks.push(
				Promise.resolve()
					.then(() => listener.handler(name, ...args))
					.catch(error => {
						throw wrapPluginError(listener.record.plugin.name, `event:${name}`, listener.record.index, error);
					}),
			);
		}
		return tasks;
	}

	protected async settleEventTasks(
		name: GatewayEvents | CustomEventsKeys | string,
		tasks: readonly Promise<unknown>[],
	) {
		const results = await Promise.allSettled(tasks);
		await Promise.all(
			results.map(async result => {
				if (result.status === 'rejected') await this.reportEventFailure(name, result.reason);
			}),
		);
	}

	protected async reportEventFailure(name: GatewayEvents | CustomEventsKeys | string, error: unknown) {
		await Promise.all(
			this.getPluginErrorListeners().map(async listener => {
				try {
					await listener.handler(error, String(name));
				} catch (observerError) {
					this.logger.warn('<Client>.events.onError', observerError, name);
				}
			}),
		);
		await this.onFail(name, error);
	}
}

export class EventHandler extends CustomEventHandler {
	constructor(protected client: Client | WorkerClient) {
		super(client);
	}

	filter = (path: string) => path.endsWith('.js') || (!path.endsWith('.d.ts') && path.endsWith('.ts'));

	discordEvents = Object.keys(RawEvents).map(x => ReplaceRegex.camel(x.toLowerCase())) as ClientNameEvents[];

	set(events: ClientEvent[]) {
		for (const event of events) {
			const instance = this.callback(event);
			if (!instance) continue;
			if (typeof instance?.run !== 'function') {
				this.logger.warn('Missing event run function');
				continue;
			}
			this.values[normalizeEventName(instance.data.name) as CustomEventsKeys | GatewayEvents] = instance as EventValue;
		}
	}

	async load(eventsDir: string) {
		const paths = await this.loadFilesK<{ file: ClientEvent }>(await this.getFiles(eventsDir));

		for (const { events, file } of paths.map(x => ({
			events: this.onFile(x.file),
			file: x,
		}))) {
			if (!events) continue;
			for (const i of events) {
				const instance = this.callback(i);
				if (!instance) continue;
				if (typeof instance?.run !== 'function') {
					this.logger.warn(
						file.path.split(process.cwd()).slice(1).join(process.cwd()),
						'Missing run function, use `export default {...}` syntax',
					);
					continue;
				}
				instance.__filePath = file.path;
				this.values[normalizeEventName(instance.data.name) as CustomEventsKeys | GatewayEvents] =
					instance as EventValue;
			}
		}
	}

	async execute(raw: GatewayDispatchPayload, client: Client<true> | WorkerClient<true>, shardId: number) {
		switch (raw.t) {
			case 'MESSAGE_DELETE':
				{
					if (!client.components.values.size) break;
					const value = client.components.values.get(raw.d.id);
					if (value) {
						client.components.deleteValue(value.messageId, 'messageDelete');
					}
				}
				break;
			case 'MESSAGE_DELETE_BULK':
				{
					if (!client.components.values.size) break;
					for (const id of raw.d.ids) {
						const value = client.components.values.get(id);
						if (value) {
							client.components.deleteValue(value.messageId, 'messageDelete');
						}
					}
				}
				break;
			case 'GUILD_DELETE':
				{
					if (!client.components.values.size) break;
					// ignore unavailable guilds?
					if (raw.d.unavailable) break;
					for (const [messageId, value] of client.components.values) {
						if (value.guildId === raw.d.id) client.components.deleteValue(messageId, 'guildDelete');
					}
				}
				break;
			case 'CHANNEL_DELETE':
				{
					if (!client.components.values.size) break;

					if (raw.d.type === ChannelType.DM || raw.d.type === ChannelType.GroupDM) {
						for (const value of client.components.values) {
							if (raw.d.id === value[1].channelId) client.components.deleteValue(value[0], 'channelDelete');
						}
					} else {
						if (!raw.d.guild_id) break;
						// this is why we dont recommend to use collectors, use ComponentCommand instead
						const channels = await client.cache.channels?.valuesRaw(raw.d.guild_id);
						const threads = channels
							?.filter(
								x =>
									[ChannelType.PublicThread, ChannelType.PrivateThread, ChannelType.AnnouncementThread].includes(
										x.type,
									) && (x as APIThreadChannel).parent_id === raw.d.id,
							)
							.map(x => x.id);
						for (const value of client.components.values) {
							const channelId = value[1].channelId;
							if (raw.d.id === channelId || threads?.includes(channelId)) {
								client.components.deleteValue(value[0], 'channelDelete');
							}
						}
					}
				}
				break;
			case 'THREAD_DELETE':
				{
					if (!client.components.values.size) break;
					for (const value of client.components.values) {
						if (value[1].channelId === raw.d.id) {
							client.components.deleteValue(value[0], 'channelDelete');
						}
					}
				}
				break;
		}

		await Promise.all([
			this.runEvent(raw.t as never, client, raw.d, shardId),
			this.client.collectors.run(raw.t as never, raw.d as never, this.client),
		]);
	}

	async runEvent(
		name: GatewayEvents,
		client: Client | WorkerClient,
		packet: unknown,
		shardId: number,
		runCache = true,
	) {
		const listeners = this.getPluginListeners(name);
		const anyListeners = this.getPluginAnyListeners();
		const Event = this.values[name];
		try {
			if ((!Event || (Event.data.once && Event.fired)) && !listeners.length && !anyListeners.length) {
				return runCache
					? this.client.cache.onPacket({
							t: name,
							d: packet,
						} as GatewayDispatchPayload)
					: undefined;
			}
			let hook = packet;
			let transformed = false;
			try {
				hook = await resolveRawEventData(name, client, packet);
				transformed = true;
			} catch (error) {
				await this.reportEventFailure(name, error);
			}

			if (runCache)
				await this.client.cache.onPacket({
					t: name,
					d: packet,
				} as GatewayDispatchPayload);

			const tasks: Promise<unknown>[] = [];
			if (transformed && Event && !(Event.data.once && Event.fired)) {
				Event.fired = true;
				tasks.push(Promise.resolve((Event.run as any)(hook, client, shardId)));
			}
			tasks.push(...this.createPluginListenerTasks(name, listeners, anyListeners, [hook, client, shardId]));
			await this.settleEventTasks(name, tasks);
		} catch (e) {
			await this.reportEventFailure(name, e);
		}
	}

	async reload(name: GatewayEvents | CustomEventsKeys) {
		if (isCloudfareWorker()) {
			throw new SeyfertError('RELOAD_NOT_SUPPORTED', {
				metadata: { detail: 'Reload in Cloudflare worker is not supported' },
			});
		}
		const event = this.values[name];
		if (!event?.__filePath) return null;
		delete require.cache[event.__filePath];
		const imported = await magicImport(event.__filePath).then(x => x.default ?? x);
		imported.__filePath = event.__filePath;
		this.values[name] = imported;
		return imported;
	}

	async reloadAll(stopIfFail = true) {
		for (const i in this.values) {
			try {
				await this.reload(i as GatewayEvents | CustomEventsKeys);
			} catch (e) {
				if (stopIfFail) {
					throw e;
				}
			}
		}
	}

	onFile(file: FileLoaded<ClientEvent>): ClientEvent[] | undefined {
		return file.default ? (Array.isArray(file.default) ? file.default : [file.default]) : undefined;
	}

	callback = (file: ClientEvent): ClientEvent | false => file;
}
