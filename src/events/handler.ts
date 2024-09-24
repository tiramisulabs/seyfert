import type { Client, WorkerClient } from '../client';
import type { UsingClient } from '../commands';
import type { FileLoaded } from '../commands/handler';
import {
	BaseHandler,
	type CamelCase,
	type MakeRequired,
	ReplaceRegex,
	type SnakeCase,
	isCloudfareWorker,
	magicImport,
} from '../common';
import type { ClientEvents } from '../events/hooks';
import * as RawEvents from '../events/hooks';
import type {
	GatewayChannelDeleteDispatch,
	GatewayDispatchPayload,
	GatewayGuildDeleteDispatch,
	GatewayMessageDeleteBulkDispatch,
	GatewayMessageDeleteDispatch,
	GatewayThreadDeleteDispatch,
} from '../types';
import type { ClientEvent, ClientNameEvents, CustomEvents, CustomEventsKeys, EventContext } from './event';

export type EventValue = MakeRequired<ClientEvent, '__filePath'> & { fired?: boolean };
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

export class EventHandler extends BaseHandler {
	constructor(protected client: Client | WorkerClient) {
		super(client.logger);
	}

	onFail = (event: GatewayEvents | CustomEventsKeys, err: unknown) =>
		this.logger.warn('<Client>.events.onFail', err, event);
	filter = (path: string) => path.endsWith('.js') || (!path.endsWith('.d.ts') && path.endsWith('.ts'));

	values: Partial<EventValues> = {};

	discordEvents = Object.keys(RawEvents).map(x => ReplaceRegex.camel(x.toLowerCase())) as ClientNameEvents[];

	set(events: ClientEvent[]) {
		for (const event of events) {
			const instance = this.callback(event);
			if (!instance) continue;
			if (typeof instance?.run !== 'function') {
				this.logger.warn('Missing event run function');
				continue;
			}
			this.values[
				this.discordEvents.includes(instance.data.name)
					? (ReplaceRegex.snake(instance.data.name).toUpperCase() as GatewayEvents)
					: (instance.data.name as CustomEventsKeys)
			] = instance as EventValue;
		}
	}

	async load(eventsDir: string) {
		const paths = await this.loadFilesK<{ file: ClientEvent }>(await this.getFiles(eventsDir));

		for (const { events, file } of paths.map(x => ({ events: this.onFile(x.file), file: x }))) {
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
				this.values[
					this.discordEvents.includes(instance.data.name)
						? (ReplaceRegex.snake(instance.data.name).toUpperCase() as GatewayEvents)
						: (instance.data.name as CustomEventsKeys)
				] = instance as EventValue;
			}
		}
	}

	async execute(name: GatewayEvents, ...args: [GatewayDispatchPayload, Client<true> | WorkerClient<true>, number]) {
		switch (name) {
			case 'MESSAGE_DELETE':
				{
					const { d: data } = args[0] as GatewayMessageDeleteDispatch;
					const value = [...(args[1].components?.values ?? [])].find(x => x[1].messageId === data.id);
					if (value) {
						args[1].components!.deleteValue(value[0], 'messageDelete');
					}
				}
				break;
			case 'MESSAGE_DELETE_BULK':
				{
					const { d: payload } = args[0] as GatewayMessageDeleteBulkDispatch;
					const values = [...(args[1].components?.values ?? [])];
					const value = values.find(x => {
						return payload.ids.includes(x[0]);
					});
					if (value) {
						args[1].components!.deleteValue(value[0], 'messageDelete');
					}
				}
				break;
			case 'GUILD_DELETE':
				{
					const { d: payload } = args[0] as GatewayGuildDeleteDispatch;
					// ignore unavailable guilds?
					if (payload.unavailable) break;
					const values = [...(args[1].components?.values ?? [])];
					const value = values.find(x => {
						return payload.id === x[1].guildId;
					});
					if (value) {
						args[1].components!.deleteValue(value[0], 'guildDelete');
					}
				}
				break;
			case 'THREAD_DELETE':
			case 'CHANNEL_DELETE':
				{
					const { d: payload } = args[0] as GatewayChannelDeleteDispatch | GatewayThreadDeleteDispatch;
					const values = [...(args[1].components?.values ?? [])];
					const value = values.find(x => {
						return payload.id === x[1].channelId || payload.id === x[1].threadId;
					});
					if (value) {
						args[1].components!.deleteValue(value[0], 'channelDelete');
					}
				}
				break;
		}

		await Promise.all([
			this.runEvent(args[0].t as never, args[1], args[0].d, args[2]),
			this.client.collectors.run(args[0].t as never, args[0].d as never, this.client),
		]);
	}

	async runEvent(name: GatewayEvents, client: Client | WorkerClient, packet: any, shardId: number, runCache = true) {
		const Event = this.values[name];
		if (!Event) {
			return runCache
				? this.client.cache.onPacket({
						t: name,
						d: packet,
					} as GatewayDispatchPayload)
				: undefined;
		}
		try {
			if (Event.data.once && Event.fired) {
				return runCache
					? this.client.cache.onPacket({
							t: name,
							d: packet,
						} as GatewayDispatchPayload)
					: undefined;
			}
			Event.fired = true;
			const hook = await RawEvents[name]?.(client, packet as never);
			if (runCache)
				await this.client.cache.onPacket({
					t: name,
					d: packet,
				} as GatewayDispatchPayload);
			await (Event.run as any)(hook, client, shardId);
		} catch (e) {
			await this.onFail(name, e);
		}
	}

	async runCustom<T extends CustomEventsKeys>(name: T, ...args: ResolveEventRunParams<T>) {
		const Event = this.values[name];
		if (!Event) {
			// @ts-expect-error working with non-existent types is hard
			return this.client.collectors.run(name, args, this.client);
		}
		try {
			if (Event.data.once && Event.fired) {
				// @ts-expect-error working with non-existent types is hard
				return this.client.collectors.run(name, args, this.client);
			}
			Event.fired = true;
			this.logger.debug(`executed a custom event [${name}]`, Event.data.once ? 'once' : '');

			await Promise.all([
				// @ts-expect-error working with non-existent types is hard
				Event.run(...args, this.client),
				// @ts-expect-error working with non-existent types is hard
				this.client.collectors.run(name, args, this.client),
			]);
		} catch (e) {
			await this.onFail(name, e);
		}
	}

	async reload(name: GatewayEvents | CustomEventsKeys) {
		if (isCloudfareWorker()) {
			throw new Error('Reload in cloudfare worker is not supported');
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
		return file.default ? [file.default] : undefined;
	}

	callback = (file: ClientEvent): ClientEvent | false => file;
}
