import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { describe, expect, test } from 'vitest';

async function runToExit(source: string) {
	const args =
		typeof (globalThis as { Deno?: unknown }).Deno === 'undefined'
			? ['--input-type=module', '--eval', source]
			: ['eval', source];
	return promisify(execFile)(process.execPath, args, { timeout: 5_000 });
}

describe('process lifecycle', () => {
	test.each([
		['gateway', 'new ShardManager(options).startResharder()'],
		[
			'workers',
			`new WorkerManager({
			...options,
			mode: 'custom',
			adapter: { spawn() {}, postMessage() {} },
			heartbeaterInterval: 0,
			getRC: () => ({ token: 'token', intents: 0, locations: { base: '' } }),
		}).start()`,
		],
	])('%s allows the process to exit after foreground work completes', async (_name, start) => {
		const { stdout, stderr } = await runToExit(`
			import { createRequire } from 'node:module';
			const { ShardManager, WorkerManager } = createRequire(process.cwd() + '/package.json')('./lib/index.js');
			const info = {
				shards: 1,
				url: 'wss://gateway.discord.gg',
				session_start_limit: { total: 1, remaining: 1, reset_after: 0, max_concurrency: 1 },
			};
			const options = {
				token: 'token', intents: 0, info, handlePayload() {},
				resharding: { getInfo: async () => info },
			};
			await ${start};
			await new Promise(resolve => setTimeout(resolve, 10));
			console.log('completed');
		`);

		expect(stdout.trim()).toBe('completed');
		expect(stderr).toBe('');
	}, 10_000);
});
