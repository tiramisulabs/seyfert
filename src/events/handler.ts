import type { Client, WorkerClient } from '../client';
import {
	BaseHandler,
	ReplaceRegex,
	magicImport,
	type GatewayDispatchPayload,
	type GatewayMessageCreateDispatch,
	type GatewayMessageDeleteBulkDispatch,
	type GatewayMessageDeleteDispatch,
	type MakeRequired,
	type OnFailCallback,
	type SnakeCase,
} from '../common';
import type { ClientEvents } from '../events/hooks';
import * as RawEvents from '../events/hooks';
import type { ClientEvent, ClientNameEvents } from './event';

type EventValue = MakeRequired<ClientEvent, '__filePath'> & { fired?: boolean };

type GatewayEvents = Uppercase<SnakeCase<keyof ClientEvents>>;

export interface EventHandlerLike {
	runEvent: EventHandler['runEvent'];
	execute: EventHandler['execute'];
	load: EventHandler['load'];
	reload: EventHandler['reload'];
	reloadAll: EventHandler['reloadAll'];
	values: EventHandler['values'];
	onFail: EventHandler['onFail'];
}

export class EventHandler extends BaseHandler {
	onFail: OnFailCallback = err => this.logger.warn('<Client>.events.onFail', err);
	protected filter = (path: string) => path.endsWith('.js') || (!path.endsWith('.d.ts') && path.endsWith('.ts'));

	values: Partial<Record<GatewayEvents, EventValue>> = {};

	async load(eventsDir: string) {
		for (const i of await this.loadFilesK<ClientEvent>(await this.getFiles(eventsDir))) {
			const instance = i.file;
			if (typeof instance?.run !== 'function') {
				this.logger.warn(
					i.path.split(process.cwd()).slice(1).join(process.cwd()),
					'Missing run function, use `export default {...}` syntax',
				);
				continue;
			}
			instance.__filePath = i.path;
			this.values[ReplaceRegex.snake(instance.data.name).toUpperCase() as GatewayEvents] = instance as EventValue;
			await this.__callback?.(instance);
		}
	}

	async execute(name: GatewayEvents, ...args: [GatewayDispatchPayload, Client<true> | WorkerClient<true>, number]) {
		switch (name) {
			case 'GUILD_DELETE':
			case 'CHANNEL_UPDATE':
				await this.runEvent(args[0].t, args[1], args[0], args[2]);
				await args[1].cache.onPacket(args[0]);
				return;
			case 'MESSAGE_CREATE':
				{
					const { d: data } = args[0] as GatewayMessageCreateDispatch;
					if (args[1].components?.values.has(data.interaction?.id ?? data.id)) {
						args[1].components.values.get(data.interaction?.id ?? data.id)!.messageId = data.id;
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
	}

	async runEvent(name: GatewayEvents, client: Client | WorkerClient, packet: any, shardId: number) {
		const Event = this.values[name];
		if (!Event) {
			return;
		}
		try {
			if (Event.data.once && Event.fired) {
				return;
			}
			Event.fired = true;
			const hook = await RawEvents[name]?.(client, packet as never);
			await Event.run(...[hook, client, shardId]);
		} catch (e) {
			await this.onFail(e);
		}
	}

	async reload(name: ClientNameEvents) {
		const eventName = ReplaceRegex.snake(name).toUpperCase() as GatewayEvents;
		const event = this.values[eventName];
		if (!event) return null;
		delete require.cache[event.__filePath];
		const imported = await magicImport(event.__filePath).then(x => x.default ?? x);
		imported.__filePath = event.__filePath;
		this.values[eventName] = imported;
		return imported;
	}

	async reloadAll() {
		for (const i in this.values) {
			await this.reload(ReplaceRegex.camel(i) as ClientNameEvents);
		}
	}
}
