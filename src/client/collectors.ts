import { randomUUID } from 'node:crypto';
import type { Awaitable, CamelCase, SnakeCase } from '../common';
import type { ClientNameEvents, GatewayEvents } from '../events';
import type { ClientEvents } from '../events/hooks';
import { error } from 'node:console';

type SnakeCaseClientNameEvents = Uppercase<SnakeCase<ClientNameEvents>>;

type RunData<T extends SnakeCaseClientNameEvents> = {
	options: {
		event: T;
		idle?: number;
		timeout?: number;
		onStop?: (reason: string) => unknown;
		onStopError?: (reason: string, error: unknown) => unknown;
		filter: (arg: Awaited<ClientEvents[CamelCase<Lowercase<T>>]>) => Awaitable<boolean>;
		run: (arg: Awaited<ClientEvents[CamelCase<Lowercase<T>>]>, stop: (reason?: string) => void) => unknown;
		onRunError?: (
			arg: Awaited<ClientEvents[CamelCase<Lowercase<T>>]>,
			error: unknown,
			stop: (reason?: string) => void,
		) => unknown;
	};
	idle?: NodeJS.Timeout;
	timeout?: NodeJS.Timeout;
	nonce: string;
};

export class Collectors {
	readonly values = new Map<SnakeCaseClientNameEvents, RunData<any>[]>();

	private generateRandomUUID(name: SnakeCaseClientNameEvents) {
		const collectors = this.values.get(name);
		if (!collectors) return '*';

		let nonce = randomUUID();

		while (collectors.find(x => x.nonce === nonce)) {
			nonce = randomUUID();
		}

		return nonce;
	}

	create<T extends SnakeCaseClientNameEvents>(options: RunData<T>['options']) {
		const nonce = this.generateRandomUUID(options.event);

		if (!this.values.has(options.event)) {
			this.values.set(options.event, []);
		}

		this.values.get(options.event)!.push({
			options: {
				...options,
				name: options.event,
			} as RunData<any>['options'],
			idle:
				options.idle && options.idle > 0
					? setTimeout(() => {
							return this.delete(options.event, nonce, 'idle');
						}, options.idle)
					: undefined,
			timeout:
				options.timeout && options.timeout > 0
					? setTimeout(() => {
							return this.delete(options.event, nonce, 'timeout');
						}, options.timeout)
					: undefined,
			nonce,
		});
		return options;
	}

	private async delete(name: SnakeCaseClientNameEvents, nonce: string, reason = 'unknown') {
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
			await collector.options.onStopError?.(reason, error);
		}
	}

	/**@internal */
	async run<T extends GatewayEvents>(name: T, data: Awaited<ClientEvents[CamelCase<Lowercase<T>>]>) {
		const collectors = this.values.get(name);
		if (!collectors) return;

		for (const i of collectors) {
			if (await i.options.filter(data)) {
				i.idle?.refresh();
				const stop = (reason = 'unknown') => {
					return this.delete(i.options.event, i.nonce, reason);
				};
				try {
					await i.options.run(data, stop);
				} catch (e) {
					await i.options.onRunError?.(data, e, stop);
				}
				break;
			}
		}
	}
}
