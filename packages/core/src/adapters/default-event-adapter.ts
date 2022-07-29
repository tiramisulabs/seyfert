import type { EventAdapter } from './event-adapter';
import type { Events } from './events';
import EventEmitter from 'node:events';

export class DefaultEventAdapter extends EventEmitter implements EventAdapter {
    override on<K extends keyof Events>(event: K, func: Events[K]): this;
    override on<K extends string>(event: K, func: (...args: unknown[]) => unknown): this {
		return super.on(event, func);
	}

	override off<K extends keyof Events>(event: K, func: Events[K]): this;
    override off<K extends keyof Events>(event: K, func: (...args: unknown[]) => unknown): this {
		return super.off(event, func);
	}

	override once<K extends keyof Events>(event: K, func: Events[K]): this;
    override once<K extends string>(event: K, func: (...args: unknown[]) => unknown): this {
		return super.once(event, func);
	}

	override emit<K extends keyof Events>(event: K, ...params: Parameters<Events[K]>): boolean;
    override emit<K extends string>(event: K, ...params: unknown[]): boolean {
		return super.emit(event, ...params);
	}
}
