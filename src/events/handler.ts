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
import { type APIThreadChannel, ChannelType, type GatewayDispatchPayload } from '../types';
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
		const Event = this.values[name];
		try {
			if (!Event || (Event.data.once && Event.fired)) {
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
		try {
			if (!Event || (Event.data.once && Event.fired)) {
				// @ts-expect-error
				return this.client.collectors.run(name, args, this.client);
			}
			Event.fired = true;
			this.logger.debug(`executed a custom event [${name}]`, Event.data.once ? 'once' : '');

			await Promise.all([
				(Event.run as any)(...args, this.client),
				// @ts-expect-error
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
