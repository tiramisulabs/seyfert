import { randomUUID } from 'node:crypto';
import type { WorkerData } from '../../websocket';
import type { WorkerSendCacheRequest } from '../../websocket/discord/worker';
import type { Adapter } from './types';
import { lazyLoadPackage } from '../../common';

let parentPort: import('node:worker_threads').MessagePort;

export class WorkerAdapter implements Adapter {
	isAsync = true;
	promises = new Map<string, { resolve: (value: unknown) => void; timeout: NodeJS.Timeout }>();

	constructor(public workerData: WorkerData) {
		const worker_threads = lazyLoadPackage<typeof import('node:worker_threads')>('node:worker_threads');
		if (worker_threads?.parentPort) parentPort = worker_threads.parentPort;
	}

	postMessage(body: any) {
		if (parentPort) return parentPort.postMessage(body);
		return process.send!(body);
	}

	protected send(method: WorkerSendCacheRequest['method'], ...args: any[]): Promise<any> {
		const nonce = randomUUID();
		if (this.promises.has(nonce)) return this.send(method, ...args);

		this.postMessage({
			type: 'CACHE_REQUEST',
			args,
			nonce,
			method,
			workerId: this.workerData.workerId,
		} satisfies WorkerSendCacheRequest);

		return new Promise<any>((res, rej) => {
			const timeout = setTimeout(() => {
				this.promises.delete(nonce);
				rej(new Error('Timeout cache request'));
			}, 60e3);
			this.promises.set(nonce, { resolve: res, timeout });
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

	bulkSet(...rest: any[]) {
		return this.send('bulkSet', ...rest);
	}

	set(...rest: any[]) {
		return this.send('set', ...rest);
	}

	bulkPatch(...rest: any[]) {
		return this.send('bulkPatch', ...rest);
	}

	patch(...rest: any[]) {
		return this.send('patch', ...rest);
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

	bulkAddToRelationShip(...rest: any[]) {
		return this.send('bulkAddToRelationShip', ...rest);
	}

	addToRelationship(...rest: any[]) {
		return this.send('addToRelationship', ...rest);
	}

	removeToRelationship(...rest: any[]) {
		return this.send('removeToRelationship', ...rest);
	}

	removeRelationship(...rest: any[]) {
		return this.send('removeRelationship', ...rest);
	}
}
