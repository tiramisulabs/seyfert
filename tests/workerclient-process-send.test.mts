import { fork } from 'node:child_process';
import { once } from 'node:events';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { finished } from 'node:stream/promises';
import { describe, expect, test } from 'vitest';

async function runWorkerFixture(execArgv = process.execArgv) {
	const child = fork(join(__dirname, 'fixtures/workerclient-process-send.mjs'), [], {
		execArgv,
		stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
	});
	let stdout = '';
	let stderr = '';
	let phase = 'waiting for READY';
	child.stdout!.setEncoding('utf8');
	child.stderr!.setEncoding('utf8');
	child.stdout!.on('data', chunk => (stdout += chunk));
	child.stderr!.on('data', chunk => (stderr += chunk));

	// Observe early exits and drain both streams before reporting a startup failure.
	const exit = once(child, 'exit');
	const exited = Promise.all([exit, finished(child.stdout!), finished(child.stderr!)]).then(([[exitCode, signal]]) => ({
		exitCode,
		signal,
	}));
	let timer: ReturnType<typeof setTimeout>;
	const deadline = new Promise<never>((_resolve, reject) => {
		// Leave time to collect diagnostics and reap the child before Vitest's timeout.
		timer = setTimeout(() => reject(new Error('IPC fixture timed out')), 10_000);
	});

	try {
		const [message] = await Promise.race([
			once(child, 'message'),
			exited.then(() => {
				throw new Error('IPC fixture exited before READY');
			}),
			deadline,
		]);
		expect(message).toEqual({ type: 'READY' });
		phase = 'waiting for exit after disconnect';
		child.disconnect();
		const result = await Promise.race([exited, deadline]);
		return { ...result, stdout: stdout.trim(), stderr };
	} catch (cause) {
		throw new Error(
			`IPC fixture failed while ${phase}: exitCode=${child.exitCode}, signal=${child.signalCode}\n` +
				`stdout: ${stdout}\nstderr: ${stderr}`,
			{ cause },
		);
	} finally {
		clearTimeout(timer!);
		if (child.exitCode === null && child.signalCode === null) child.kill();
		child.stdout!.destroy();
		child.stderr!.destroy();
		await exit.catch(() => {});
	}
}

describe.skipIf(Boolean(process.versions.bun) || typeof (globalThis as { Deno?: unknown }).Deno !== 'undefined')(
	'WorkerClient cluster transport',
	() => {
		test('rejects when the native child-process IPC channel closes', async () => {
			await expect(runWorkerFixture()).resolves.toEqual({
				exitCode: 0,
				signal: null,
				stdout: 'ERR_IPC_CHANNEL_CLOSED',
				stderr: '',
			});
		}, 15_000);

		test('reports startup errors before READY instead of hanging', async () => {
			const missingPreload = join(__dirname, 'fixtures/missing-workerclient-preload.cjs');
			await expect(runWorkerFixture(['--require', missingPreload])).rejects.toThrow(
				/waiting for READY: exitCode=1, signal=null[\s\S]*MODULE_NOT_FOUND/,
			);
		}, 15_000);

		test('loads the fixture independently of the working directory', async () => {
			const cwd = process.cwd();
			const directory = mkdtempSync(join(tmpdir(), 'seyfert-ipc-cwd-'));
			try {
				process.chdir(directory);
				await expect(runWorkerFixture()).resolves.toMatchObject({
					exitCode: 0,
					stdout: 'ERR_IPC_CHANNEL_CLOSED',
				});
			} finally {
				process.chdir(cwd);
				rmSync(directory, { recursive: true, force: true });
			}
		}, 15_000);
	},
);
