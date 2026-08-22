import { parentPort } from 'node:worker_threads';

parentPort?.postMessage({
	inherited: process.env.SEYFERT_WORKER_ENV_TEST,
	spawning: process.env.SEYFERT_SPAWNING,
});
