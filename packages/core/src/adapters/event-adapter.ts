import type { EventEmitter } from 'node:events';
import type { Events } from './events';

export interface EventAdapter extends Omit<EventEmitter, 'emit' | 'on' | 'off' | 'once'> {
	options?: any;

	emit<K extends keyof Events>(
		event: K,
		...params: Parameters<Events[K]>
	): boolean;

	on<K extends keyof Events>(
		event: K,
		func: Events[K]
	): unknown;

	off<K extends keyof Events>(
		event: K,
		func: Events[K]
	): unknown;

	once<K extends keyof Events>(
		event: K,
		func: Events[K]
	): unknown;
}
