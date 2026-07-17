import { createMockBot } from '@slipher/testing';
import { readdir, readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { Client } from '../lib';

// Other serial suites temporarily change cwd; the launch environment keeps the repository root stable.
const repositoryRoot = process.env.INIT_CWD ?? process.env.PWD ?? process.cwd();
const workspaceRequire = createRequire(join(repositoryRoot, 'tests', 'package.json'));

async function collectFiles(directory: string): Promise<string[]> {
	const files: string[] = [];
	for (const entry of await readdir(directory, { withFileTypes: true })) {
		const path = join(directory, entry.name);
		if (entry.isDirectory()) files.push(...(await collectFiles(path)));
		else if (entry.name.endsWith('.js') || entry.name.endsWith('.d.ts')) files.push(path);
	}
	return files;
}

describe('@slipher/testing harness', () => {
	test('boots against the current source checkout', async () => {
		await using bot = await createMockBot();

		expect(bot.client).toBeInstanceOf(Client);
	});

	test('keeps the Deno adapter exports aligned with toolkit imports', async () => {
		const testingRoot = dirname(workspaceRequire.resolve('@slipher/testing/package.json'));
		const importedSeyfertModules = new Set<string>();
		for (const path of await collectFiles(join(testingRoot, 'lib'))) {
			const source = await readFile(path, 'utf8');
			for (const match of source.matchAll(/(?:from\s+|require\(|import\()\s*['"](seyfert(?:\/[^'"]*)?)['"]/g)) {
				importedSeyfertModules.add(match[1]);
			}
		}

		const adapterPackage = JSON.parse(
			await readFile(join(repositoryRoot, 'tests', 'deno-seyfert', 'package.json'), 'utf8'),
		) as { exports: Record<string, string> };
		const requiredExports = [...importedSeyfertModules]
			.map(specifier => (specifier === 'seyfert' ? '.' : `.${specifier.slice('seyfert'.length)}`))
			.sort();

		expect(Object.keys(adapterPackage.exports).sort()).toEqual(requiredExports);
	});
});
