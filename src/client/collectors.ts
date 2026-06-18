import { randomUUID, type UUID } from 'node:crypto';
import type { UsingClient } from '../commands';
import { type Awaitable, type CamelCase, ReplaceRegex } from '../common';
import type { CallbackEventHandler, ClientNameEvents, CustomEventsKeys, GatewayEvents } from '../events';
import { resolveRawEventData } from '../events/utils';

export type AllClientEvents = CustomEventsKeys | ClientNameEvents;
type ClientDispatchEvent = AllClientEvents | GatewayEvents;
export type ParseClientEventName<T extends ClientDispatchEvent> = T extends GatewayEvents ? CamelCase<T> : T;

export type CollectorRunPameters<T extends AllClientEvents> = Awaited<
	Parameters<CallbackEventHandler[ParseClientEventName<T>]>[0]
>;

type RunData<T extends AllClientEvents> = {
	options: {
		event: T;
		idle?: number;
		timeout?: number;
		onStop?: (reason: string) => unknown;
		onStopError?: (reason: string, error: unknown) => unknown;
		filter: (arg: CollectorRunPameters<T>) => Awaitable<boolean>;
		run: (arg: CollectorRunPameters<T>, stop: (reason?: string) => void) => unknown;
		onRunError?: (arg: CollectorRunPameters<T>, error: unknown, stop: (reason?: string) => void) => unknown;
	};
	idle?: NodeJS.Timeout;
	timeout?: NodeJS.Timeout;
	nonce: string;
};

function normalizeCollectorEventName<T extends ClientDispatchEvent>(name: T): ParseClientEventName<T> {
	return (name === name.toUpperCase() ? ReplaceRegex.camel(name.toLowerCase()) : name) as ParseClientEventName<T>;
}

export class Collectors {
	readonly values = new Map<AllClientEvents, RunData<any>[]>();

	private generateRandomUUID(name: AllClientEvents): UUID | '*' {
		const collectors = this.values.get(name);
		if (!collectors) return '*';

		let nonce = randomUUID();

		while (collectors.find(x => x.nonce === nonce)) {
			nonce = randomUUID();
		}

		return nonce;
	}

	create<T extends AllClientEvents>(options: RunData<T>['options']) {
		const event = options.event;
		const nonce = this.generateRandomUUID(event);

		if (!this.values.has(event)) {
			this.values.set(event, []);
		}

		this.values.get(event)!.push({
			options: {
				...options,
				event,
			} as RunData<any>['options'],
			idle:
				options.idle && options.idle > 0
					? setTimeout(() => {
							return this.delete(event, nonce, 'idle');
						}, options.idle)
					: undefined,
			timeout:
				options.timeout && options.timeout > 0
					? setTimeout(() => {
							return this.delete(event, nonce, 'timeout');
						}, options.timeout)
					: undefined,
			nonce,
		});
		return options;
	}

	private async delete(name: AllClientEvents, nonce: string, reason = 'unknown') {
		const collectors = this.values.get(name);

		if (!collectors?.length) {
			if (collectors) this.values.delete(name);
			return;
		}

		const index = collectors.findIndex(x => x.nonce === nonce);
		if (index === -1) return;
		const collector = collectors[index];
		clearTimeout(collector.idle);
		clearTimeout(collector.timeout);
		collectors.splice(index, 1);
		try {
			await collector.options.onStop?.(reason);
		} catch (e) {
			await collector.options.onStopError?.(reason, e);
		}
	}

	/**@internal */
	async run<T extends ClientDispatchEvent>(
		name: T,
		raw: Awaited<Parameters<CallbackEventHandler[ParseClientEventName<T>]>[0]>,
		client: UsingClient,
	) {
		const event = normalizeCollectorEventName(name);
		const collectors = this.values.get(event);
		if (!collectors) return;

		const data = (await resolveRawEventData(name, client, raw)) ?? raw;

		for (const i of collectors) {
			if (await i.options.filter(data as never)) {
				i.idle?.refresh();
				const stop = (reason = 'unknown') => {
					return this.delete(i.options.event, i.nonce, reason);
				};
				try {
					await i.options.run(data as never, stop);
				} catch (e) {
					await i.options.onRunError?.(data as never, e, stop);
				}
				break;
			}
		}
	}
}
