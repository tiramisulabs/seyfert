import { randomUUID } from 'node:crypto';
import { lazyLoadPackage, SeyfertError } from '../../common';
import type { WorkerData } from '../../websocket';
import type { WorkerSendCacheRequest } from '../../websocket/discord/worker';
import type { Adapter, AdapterEntry, AdapterRelationship } from './types';

let parentPort: import('node:worker_threads').MessagePort;

export class WorkerAdapter implements Adapter {
	isAsync = true;
	promises = new Map<
		string,
		{ resolve: (value: unknown) => void; reject: (error: unknown) => void; timeout: NodeJS.Timeout }
	>();

	constructor(public workerData: WorkerData) {
		const worker_threads = lazyLoadPackage<typeof import('node:worker_threads')>('node:worker_threads');
		if (worker_threads?.parentPort) parentPort = worker_threads.parentPort;
	}

	start() {
		//
	}

	postMessage(body: any): unknown {
		if (parentPort) return parentPort.postMessage(body);
		return process.send!(body);
	}

	protected send(method: WorkerSendCacheRequest['method'], ...args: any[]): Promise<any> {
		const nonce = randomUUID();
		if (this.promises.has(nonce)) return this.send(method, ...args);

		return new Promise<any>((res, rej) => {
			const timeout = setTimeout(() => {
				this.promises.delete(nonce);
				rej(new SeyfertError('CACHE_TIMEOUT', { metadata: { ...{ nonce, method }, detail: 'Timeout cache request' } }));
			}, 60e3);
			const pending = { resolve: res, reject: rej, timeout };
			const rejectPending = (error: unknown) => {
				if (this.promises.get(nonce) !== pending) return;
				clearTimeout(timeout);
				this.promises.delete(nonce);
				rej(error);
			};
			this.promises.set(nonce, pending);
			try {
				const dispatched = this.postMessage({
					type: 'CACHE_REQUEST',
					args,
					nonce,
					method,
					workerId: this.workerData.workerId,
				} satisfies WorkerSendCacheRequest);
				if (dispatched && (typeof dispatched === 'object' || typeof dispatched === 'function')) {
					void Promise.resolve(dispatched).catch(rejectPending);
				}
			} catch (error) {
				rejectPending(error);
			}
		});
	}

	scan(...rest: any[]) {
		return this.send('scan', ...rest);
	}

	bulkGet(...rest: any[]) {
		return this.send('bulkGet', ...rest);
	}

	get(...rest: any[]) {
		return this.send('get', ...rest);
	}

	bulkSet(entries: AdapterEntry[]) {
		return this.send('bulkSet', entries);
	}

	set(key: string, value: any, relationship: AdapterRelationship) {
		return this.send('set', key, value, relationship);
	}

	bulkPatch(entries: AdapterEntry[]) {
		return this.send('bulkPatch', entries);
	}

	patch(key: string, value: any, relationship: AdapterRelationship) {
		return this.send('patch', key, value, relationship);
	}

	values(...rest: any[]) {
		return this.send('values', ...rest);
	}

	keys(...rest: any[]) {
		return this.send('keys', ...rest);
	}

	count(...rest: any[]) {
		return this.send('count', ...rest);
	}

	bulkRemove(...rest: any[]) {
		return this.send('bulkRemove', ...rest);
	}

	remove(...rest: any[]) {
		return this.send('remove', ...rest);
	}

	flush() {
		return this.send('flush');
	}

	contains(...rest: any[]) {
		return this.send('contains', ...rest);
	}

	getToRelationship(...rest: any[]) {
		return this.send('getToRelationship', ...rest);
	}

	removeToRelationship(...rest: any[]) {
		return this.send('removeToRelationship', ...rest);
	}

	removeRelationship(...rest: any[]) {
		return this.send('removeRelationship', ...rest);
	}
}
