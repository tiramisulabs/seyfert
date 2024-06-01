import type {
	GatewayDispatchPayload,
	GatewayMessageCreateDispatch,
	GatewayMessageDeleteBulkDispatch,
	GatewayMessageDeleteDispatch,
} from 'discord-api-types/v10';
import type { Client, WorkerClient } from '../client';
import { BaseHandler, ReplaceRegex, magicImport, type MakeRequired, type SnakeCase } from '../common';
import type { ClientEvents } from '../events/hooks';
import * as RawEvents from '../events/hooks';
import type { ClientEvent, ClientNameEvents } from './event';

export type EventValue = MakeRequired<ClientEvent, '__filePath'> & { fired?: boolean };

export type GatewayEvents = Uppercase<SnakeCase<keyof ClientEvents>>;

export class EventHandler extends BaseHandler {
	constructor(protected client: Client | WorkerClient) {
		super(client.logger);
	}

	onFail = (event: GatewayEvents, err: unknown) => this.logger.warn('<Client>.events.onFail', err, event);
	protected filter = (path: string) => path.endsWith('.js') || (!path.endsWith('.d.ts') && path.endsWith('.ts'));

	values: Partial<Record<GatewayEvents, EventValue>> = {};

	async load(eventsDir: string, instances?: { file: ClientEvent; path: string }[]) {
		for (const i of instances ?? (await this.loadFilesK<ClientEvent>(await this.getFiles(eventsDir)))) {
			const instance = this.callback(i.file);
			if (!instance) continue;
			if (typeof instance?.run !== 'function') {
				this.logger.warn(
					i.path.split(process.cwd()).slice(1).join(process.cwd()),
					'Missing run function, use `export default {...}` syntax',
				);
				continue;
			}
			instance.__filePath = i.path;
			this.values[ReplaceRegex.snake(instance.data.name).toUpperCase() as GatewayEvents] = instance as EventValue;
		}
	}

	async execute(name: GatewayEvents, ...args: [GatewayDispatchPayload, Client<true> | WorkerClient<true>, number]) {
		switch (name) {
			case 'MESSAGE_CREATE':
				{
					const { d: data } = args[0] as GatewayMessageCreateDispatch;
					if (args[1].components?.values.has(data.interaction_metadata?.id ?? data.id)) {
						args[1].components.values.get(data.interaction_metadata?.id ?? data.id)!.messageId = data.id;
					}
				}
				break;
			case 'MESSAGE_DELETE':
				{
					const { d: data } = args[0] as GatewayMessageDeleteDispatch;
					const value = [...(args[1].components?.values ?? [])].find(x => x[1].messageId === data.id);
					if (value) {
						args[1].components!.onMessageDelete(value[0]);
					}
				}
				break;
			case 'MESSAGE_DELETE_BULK':
				{
					const { d: data } = args[0] as GatewayMessageDeleteBulkDispatch;
					const values = [...(args[1].components?.values ?? [])];
					data.ids.forEach(id => {
						const value = values.find(x => x[1].messageId === id);
						if (value) {
							args[1].components!.onMessageDelete(value[0]);
						}
					});
				}
				break;
		}

		await this.runEvent(args[0].t, args[1], args[0].d, args[2]);
		await this.client.collectors.run(args[0].t, args[0].d);
	}

	async runEvent(name: GatewayEvents, client: Client | WorkerClient, packet: any, shardId: number) {
		const Event = this.values[name];
		if (!Event) {
			return this.client.cache.onPacket({
				t: name,
				d: packet,
			} as GatewayDispatchPayload);
		}
		try {
			if (Event.data.once && Event.fired) {
				return this.client.cache.onPacket({
					t: name,
					d: packet,
				} as GatewayDispatchPayload);
			}
			Event.fired = true;
			const hook = await RawEvents[name]?.(client, packet as never);
			if (name !== 'RAW')
				await this.client.cache.onPacket({
					t: name,
					d: packet,
				} as GatewayDispatchPayload);
			await Event.run(...[hook, client, shardId]);
		} catch (e) {
			await this.onFail(name, e);
		}
	}

	async reload(name: ClientNameEvents) {
		const eventName = ReplaceRegex.snake(name).toUpperCase() as GatewayEvents;
		const event = this.values[eventName];
		if (!event?.__filePath) return null;
		delete require.cache[event.__filePath];
		const imported = await magicImport(event.__filePath).then(x => x.default ?? x);
		imported.__filePath = event.__filePath;
		this.values[eventName] = imported;
		return imported;
	}

	async reloadAll(stopIfFail = true) {
		for (const i in this.values) {
			try {
				await this.reload(ReplaceRegex.camel(i) as ClientNameEvents);
			} catch (e) {
				if (stopIfFail) {
					throw e;
				}
			}
		}
	}

	setHandlers({ callback }: { callback: EventHandler['callback'] }) {
		this.callback = callback;
	}

	callback = (file: ClientEvent): ClientEvent | false => file;
}
