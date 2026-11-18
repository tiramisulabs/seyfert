import { mkdtemp, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, test } from 'vitest';
import { Command, ComponentCommand, SeyfertError } from '../src';
import { BaseClient } from '../src/client/base';

// Fixture files are plain CommonJS and reach the classes under test through globals.
const bases = globalThis as { __ReloadComponentBase?: typeof ComponentCommand; __ReloadCommandBase?: typeof Command };
bases.__ReloadComponentBase = ComponentCommand;
bases.__ReloadCommandBase = Command;

const tempDirs: string[] = [];
afterEach(async () => {
	await Promise.all(tempDirs.splice(0).map(dir => rm(dir, { recursive: true, force: true })));
});

function createClient() {
	const client = new BaseClient({
		getRC: () => ({ token: Buffer.from('bot').toString('base64'), locations: { base: '' }, intents: 0 }),
	});
	// The bot setup this fix is for: a file's default export may be a list of classes.
	const onFile = (file: { default?: unknown }) => [file.default ?? []].flat() as never;
	client.components.onFile = onFile;
	client.commands.onFile = onFile;
	return client;
}

async function fixtureDir(prefix: string) {
	const dir = await mkdtemp(join(tmpdir(), prefix));
	tempDirs.push(dir);
	return dir;
}

const components = (version: string) => `
const ComponentCommand = globalThis.__ReloadComponentBase;
exports.default = [
	class extends ComponentCommand { componentType = 'Button'; customId = '${version}-button'; run() {} },
	class extends ComponentCommand { componentType = 'StringSelect'; customId = '${version}-select'; run() {} },
];
`;
const singleComponent = (customId: string) => `
const ComponentCommand = globalThis.__ReloadComponentBase;
exports.default = class extends ComponentCommand { componentType = 'Button'; customId = '${customId}'; run() {} };
`;
const commands = (version: string) => `
const Command = globalThis.__ReloadCommandBase;
exports.default = [
	class extends Command { name = '${version}-first'; description = 'First'; run() {} },
	class extends Command { name = '${version}-second'; description = 'Second'; run() {} },
];
`;
const singleCommand = (name: string) => `
const Command = globalThis.__ReloadCommandBase;
exports.default = class extends Command { name = '${name}'; description = 'Single'; run() {} };
`;

describe('ComponentHandler reload', () => {
	test('reloads every component a file exports through onFile, in place', async () => {
		const client = createClient();
		const dir = await fixtureDir('seyfert-components-reload-');
		await writeFile(join(dir, 'a-first.js'), singleComponent('first'));
		await writeFile(join(dir, 'b-many.js'), components('v1'));
		await writeFile(join(dir, 'c-last.js'), singleComponent('last'));
		await client.components.load(dir);
		const ids = () => client.components.commands.map(component => String(component.customId));
		// The load order depends on the runtime's directory listing, so reload is checked against it.
		const loaded = ids();
		expect([...loaded].sort()).toEqual(['first', 'last', 'v1-button', 'v1-select']);

		await writeFile(join(dir, 'b-many.js'), components('v2'));
		const result = await client.components.reloadFiles();
		expect(result.failed).toEqual([]);
		expect([...result.reloaded].sort()).toEqual([
			join(dir, 'a-first.js'),
			join(dir, 'b-many.js'),
			join(dir, 'c-last.js'),
		]);

		// Both classes from the list come back, in their place, with the new code.
		const updated = loaded.map(id => id.replace('v1-', 'v2-'));
		expect(ids()).toEqual(updated);
		await expect(client.components.reload('b-many')).resolves.not.toBeNull();
		expect(ids()).toEqual(updated);
	});

	test('reloads through a symlink and passes each component through the creation callback once', async () => {
		const client = createClient();
		const dir = await fixtureDir('seyfert-components-reload-create-');
		const alias = join(await fixtureDir('seyfert-components-reload-link-'), 'alias');
		await symlink(dir, alias, 'junction');
		const file = join(alias, 'buttons.js');
		await writeFile(file, components('v1'));
		await client.components.load(alias);

		const original = client.components.callback.bind(client.components);
		let calls = 0;
		client.components.callback = (value, create) => {
			calls++;
			return original(value, create);
		};
		await writeFile(file, components('v2'));
		await expect(client.components.reloadFiles()).resolves.toEqual({ reloaded: [file], failed: [] });
		expect(calls).toBe(2);
		expect(client.components.commands.map(command => command.customId)).toEqual(['v2-button', 'v2-select']);
	});

	test('keeps the components of a file that fails or comes back empty, and reports it', async () => {
		const client = createClient();
		const dir = await fixtureDir('seyfert-components-reload-fail-');
		const broken = join(dir, 'broken.js');
		const emptied = join(dir, 'emptied.js');
		await writeFile(broken, components('v1'));
		await writeFile(emptied, singleComponent('kept'));
		await client.components.load(dir);
		const ids = () => client.components.commands.map(component => String(component.customId));
		const loaded = ids();

		await writeFile(broken, "throw new Error('syntax went wrong');\n");
		await writeFile(emptied, 'module.exports = {};\n');
		const result = await client.components.reloadFiles(false);

		expect(result.reloaded).toEqual([]);
		expect(result.failed.map(failure => failure.path).sort()).toEqual([broken, emptied]);
		const failure = (path: string) => result.failed.find(entry => entry.path === path)?.error;
		// The import error itself depends on the runtime's module loader, so only its presence is checked.
		expect(failure(broken)).toBeInstanceOf(Error);
		expect(SeyfertError.is(failure(emptied), 'RELOAD_EMPTY')).toBe(true);
		expect(ids()).toEqual(loaded);
		// By default the first failure stops the reload and throws, with the report so far attached.
		await expect(client.components.reloadAll()).rejects.toSatisfy(
			error =>
				SeyfertError.is(error, 'RELOAD_FAILED') && (error.metadata?.failed as unknown[] | undefined)?.length === 1,
		);
		await expect(client.components.reload('emptied')).resolves.toBeNull();
		expect(client.components.commands).toHaveLength(3);
	});
});

describe('reload options', () => {
	test('stopIfFail stops at the first file that fails', async () => {
		const client = createClient();
		const dir = await fixtureDir('seyfert-components-reload-stop-');
		await writeFile(join(dir, 'a-broken.js'), singleComponent('first'));
		await writeFile(join(dir, 'b-later.js'), singleComponent('later-v1'));
		await client.components.load(dir);
		const ids = () => client.components.commands.map(component => String(component.customId));
		// Files reload in load order, which depends on the runtime's directory listing.
		const loaded = ids();
		const laterReloadsFirst = loaded.indexOf('later-v1') < loaded.indexOf('first');

		await writeFile(join(dir, 'a-broken.js'), "throw new Error('broken');\n");
		await writeFile(join(dir, 'b-later.js'), singleComponent('later-v2'));
		await expect(client.components.reloadAll()).rejects.toSatisfy(
			error =>
				SeyfertError.is(error, 'RELOAD_FAILED') && (error.metadata?.failed as unknown[] | undefined)?.length === 1,
		);

		// Nothing after the failed file was reloaded.
		expect(ids()).toEqual(loaded.map(id => (laterReloadsFirst ? id.replace('-v1', '-v2') : id)));
	});

	test('onFile sees the whole module on reload, as it does on load', async () => {
		const client = createClient();
		// An onFile that reads named exports instead of the default one.
		client.components.onFile = file => (Object.hasOwn(file, 'default') ? undefined : (Object.values(file) as never));
		const dir = await fixtureDir('seyfert-components-reload-named-');
		const named = (version: string) => `
const ComponentCommand = globalThis.__ReloadComponentBase;
exports.Confirm = class extends ComponentCommand { componentType = 'Button'; customId = '${version}-confirm'; run() {} };
exports.Cancel = class extends ComponentCommand { componentType = 'Button'; customId = '${version}-cancel'; run() {} };
`;
		await writeFile(join(dir, 'buttons.js'), named('v1'));
		await client.components.load(dir);
		await writeFile(join(dir, 'buttons.js'), named('v2'));

		await expect(client.components.reloadFiles()).resolves.toMatchObject({ failed: [] });
		expect(client.components.commands.map(component => String(component.customId))).toEqual([
			'v2-confirm',
			'v2-cancel',
		]);
	});
});

describe('CommandHandler reload', () => {
	test('reloads every command a file exports through onFile, in place', async () => {
		const client = createClient();
		const dir = await fixtureDir('seyfert-commands-reload-');
		await writeFile(join(dir, 'a-first.js'), singleCommand('first'));
		await writeFile(join(dir, 'b-many.js'), commands('v1'));
		await writeFile(join(dir, 'c-last.js'), singleCommand('last'));
		await client.commands.load(dir, client as never);
		const names = () => client.commands.values.map(command => command.name);
		const loaded = names();
		expect([...loaded].sort()).toEqual(['first', 'last', 'v1-first', 'v1-second']);

		await writeFile(join(dir, 'b-many.js'), commands('v2'));
		await expect(client.commands.reloadFiles()).resolves.toMatchObject({ failed: [] });

		const updated = loaded.map(name => name.replace('v1-', 'v2-'));
		expect(names()).toEqual(updated);
		await expect(client.commands.reload('v2-second')).resolves.toMatchObject({ name: 'v2-second' });
		expect(names()).toEqual(updated);
	});

	test('returns null when the requested command was removed from a multi-export file', async () => {
		const client = createClient();
		const dir = await fixtureDir('seyfert-commands-reload-removed-');
		const file = join(dir, 'commands.js');
		await writeFile(file, commands('v1'));
		await client.commands.load(dir, client);

		await writeFile(file, singleCommand('v1-second'));
		await expect(client.commands.reload('v1-first')).resolves.toBeNull();
		expect(client.commands.values.map(command => command.name)).toEqual(['v1-second']);

		const previous = client.commands.values[0] as Command;
		await client.commands.reloadFiles();
		await writeFile(file, singleCommand('renamed'));
		await expect(client.commands.reload(previous)).resolves.toMatchObject({ name: 'renamed' });
	});

	test('keeps the commands of a file that fails or comes back empty, and reports it', async () => {
		const client = createClient();
		const dir = await fixtureDir('seyfert-commands-reload-fail-');
		const broken = join(dir, 'broken.js');
		const emptied = join(dir, 'emptied.js');
		await writeFile(broken, commands('v1'));
		await writeFile(emptied, singleCommand('kept'));
		await client.commands.load(dir, client as never);
		const names = () => client.commands.values.map(command => command.name);
		const loaded = names();

		await writeFile(broken, "throw new Error('syntax went wrong');\n");
		await writeFile(emptied, 'module.exports = {};\n');
		const result = await client.commands.reloadFiles(false);

		expect(result.reloaded).toEqual([]);
		expect(result.failed.map(failure => failure.path).sort()).toEqual([broken, emptied]);
		expect(names()).toEqual(loaded);
		await expect(client.commands.reloadAll()).rejects.toSatisfy(error => SeyfertError.is(error, 'RELOAD_FAILED'));
		await expect(client.commands.reload('kept')).resolves.toBeNull();
		expect(client.commands.values).toHaveLength(3);
	});
});
