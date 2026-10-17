import { createRequire } from 'node:module';

const { ShardManager, WorkerManager } = createRequire(import.meta.url)('../../lib/index.js');

const info = {
	shards: 1,
	url: 'wss://gateway.discord.gg',
	session_start_limit: { total: 1, remaining: 1, reset_after: 0, max_concurrency: 1 },
};

// Keep the process alive until a poll proves that automatic resharding still runs.
const keepAlive = setTimeout(() => {
	throw new Error('Resharding never checked the gateway');
}, 10_000);
const options = {
	token: 'token',
	intents: 0,
	info,
	resharding: {
		interval: 20,
		percentage: 80,
		async getInfo() {
			clearTimeout(keepAlive);
			process.stdout.write('checked\n');
			return info;
		},
	},
};

if (process.argv[2] === 'shards') {
	const manager = new ShardManager({ ...options, handlePayload() {} });
	await manager.startResharder();
} else {
	const manager = new WorkerManager({
		...options,
		mode: 'custom',
		adapter: { spawn() {}, postMessage() {} },
		heartbeaterInterval: 0,
		getRC: () => ({ token: 'token', intents: 0, locations: { base: '' } }),
	});
	await manager.start();
}
