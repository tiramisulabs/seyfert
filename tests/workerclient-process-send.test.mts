import { fork } from 'node:child_process';
import { once } from 'node:events';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';

describe('WorkerClient cluster transport', () => {
	test.skipIf(Boolean(process.versions.bun) || typeof (globalThis as { Deno?: unknown }).Deno !== 'undefined')(
		'rejects when the native child-process IPC channel closes',
		async () => {
			const child = fork(resolve('tests/fixtures/workerclient-process-send.mjs'), [], {
				stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
			});
			let stdout = '';
			let stderr = '';
			child.stdout?.setEncoding('utf8');
			child.stderr?.setEncoding('utf8');
			child.stdout?.on('data', chunk => (stdout += chunk));
			child.stderr?.on('data', chunk => (stderr += chunk));

			try {
				await once(child, 'message');
				const exit = once(child, 'exit');
				child.disconnect();
				const [exitCode, signal] = await exit;

				expect({ exitCode, signal, stderr }).toEqual({ exitCode: 0, signal: null, stderr: '' });
				expect(stdout.trim()).toBe('ERR_IPC_CHANNEL_CLOSED');
			} finally {
				if (child.exitCode === null) child.kill();
			}
		},
		15_000,
	);
});
