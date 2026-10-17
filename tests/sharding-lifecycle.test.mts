import { execFile } from 'node:child_process';
import { resolve } from 'node:path';
import { promisify } from 'node:util';
import { describe, expect, test } from 'vitest';

describe('automatic resharding', () => {
	test.each(['shards', 'workers'])('keeps polling without keeping an idle %s process alive', async mode => {
		const runtimeArgs = typeof (globalThis as { Deno?: unknown }).Deno === 'undefined' ? [] : ['run', '-A'];
		const { stdout, stderr } = await promisify(execFile)(
			process.execPath,
			[...runtimeArgs, resolve('tests/fixtures/resharding-process-exit.mjs'), mode],
			{ timeout: 10_000 },
		);

		expect(stdout.trim()).toBe('checked');
		expect(stderr).toBe('');
	}, 15_000);
});
