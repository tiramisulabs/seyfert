import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, test, vi } from 'vitest';
import { LangsHandler } from '../src/langs/handler';

function createHandler() {
	const warn = vi.fn();
	const handler = new LangsHandler({ warn } as never);
	return { handler, warn };
}

function moduleNamespace(exports: Record<string, unknown>) {
	return Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
}

describe('LangsHandler module loading', () => {
	test('set applies synchronous hooks immediately and preserves synchronous errors', () => {
		const { handler } = createHandler();
		const result = handler.set([{ name: 'en-US.json', file: { default: { greeting: 'Hello' } } }]);

		expect(result).toBeUndefined();
		expect(handler.values['en-US']).toEqual({ greeting: 'Hello' });
		const error = new Error('invalid language');
		handler.onFile = () => {
			throw error;
		};
		expect(() => handler.set([{ name: 'es-ES.json', file: {} }])).toThrow(error);
	});

	test('set waits for asynchronous hooks and applies duplicate locales in input order', async () => {
		const { handler } = createHandler();
		const onFile = handler.onFile.bind(handler);
		let release!: () => void;
		const gate = new Promise<void>(resolve => {
			release = resolve;
		});
		handler.onFile = vi.fn((locale, file) =>
			file.file.default?.greeting === 'first' ? gate.then(() => onFile(locale, file)) : onFile(locale, file),
		);

		try {
			const completion = handler.set([
				{ name: 'en-US.json', file: { default: { greeting: 'first' } } },
				{ name: 'en-US.json', file: { default: { greeting: 'second' } } },
			]);
			expect(handler.onFile).toHaveBeenCalledTimes(1);
			expect(handler.values['en-US']).toBeUndefined();
			release();
			await completion;
			expect(handler.values['en-US']).toEqual({ greeting: 'second' });
		} finally {
			release();
		}
	});

	test.each(['reject', 'throw'] as const)('set propagates a later %s and stops parsing further files', async kind => {
		const { handler } = createHandler();
		const error = new Error('language hook failed');
		const onFile = handler.onFile.bind(handler);
		handler.onFile = vi.fn((locale, file) => {
			if (locale === 'en-US') return Promise.resolve(onFile(locale, file));
			if (kind === 'reject') return Promise.reject(error);
			throw error;
		});

		await expect(
			handler.set([
				{ name: 'en-US.json', file: { default: { greeting: 'Hello' } } },
				{ name: 'es-ES.json', file: {} },
				{ name: 'fr.json', file: {} },
			]),
		).rejects.toBe(error);
		expect(handler.onFile).toHaveBeenCalledTimes(2);
		expect(handler.values['en-US']).toEqual({ greeting: 'Hello' });
		expect(handler.values['es-ES']).toBeUndefined();
		expect(handler.values.fr).toBeUndefined();
	});

	test('prefers a valid default export over named object exports', () => {
		const { handler, warn } = createHandler();

		handler.parse({
			name: 'en-US.ts',
			path: '/langs/en-US.ts',
			file: moduleNamespace({
				default: { command: { name: 'Default' } },
				named: { command: { name: 'Named' } },
			}) as never,
		});

		expect(handler.values['en-US']).toEqual({ command: { name: 'Default' } });
		expect(warn).not.toHaveBeenCalled();
	});

	test('falls back to a single named object export with a warning', () => {
		const { handler, warn } = createHandler();

		handler.parse({
			name: 'es-ES.ts',
			path: '/langs/es-ES.ts',
			file: moduleNamespace({
				translations: { command: { name: 'Nombre' } },
			}) as never,
		});

		expect(handler.values['es-ES']).toEqual({ command: { name: 'Nombre' } });
		expect(warn).toHaveBeenCalledWith(
			expect.stringContaining('/langs/es-ES.ts'),
			expect.stringContaining('translations'),
		);
	});

	test('warns and skips ambiguous or invalid modules', () => {
		const { handler, warn } = createHandler();

		handler.parse({
			name: 'ambiguous.ts',
			path: '/langs/ambiguous.ts',
			file: moduleNamespace({
				one: { command: { name: 'One' } },
				two: { command: { name: 'Two' } },
			}) as never,
		});
		handler.parse({
			name: 'invalid.ts',
			path: '/langs/invalid.ts',
			file: moduleNamespace({
				value: 'not an object',
			}) as never,
		});

		expect(handler.values.ambiguous).toBeUndefined();
		expect(handler.values.invalid).toBeUndefined();
		expect(warn).toHaveBeenCalledWith(
			expect.stringContaining('/langs/ambiguous.ts'),
			expect.stringContaining('one, two'),
		);
		expect(warn).toHaveBeenCalledWith(expect.stringContaining('/langs/invalid.ts'), expect.stringContaining('value'));
	});

	test('awaits async onFile results while loading files', async () => {
		const tempDir = mkdtempSync(join(tmpdir(), 'seyfert-langs-'));
		try {
			writeFileSync(join(tempDir, 'en-US.json'), JSON.stringify({ greeting: 'Hello' }));
			const { handler } = createHandler();
			const onFile = handler.onFile.bind(handler);

			handler.onFile = vi.fn(async (locale, file) => {
				await Promise.resolve();
				return onFile(locale, file);
			});

			await handler.load(tempDir);

			expect(handler.values['en-US']).toEqual({ greeting: 'Hello' });
			expect(handler.onFile).toHaveBeenCalledWith(
				'en-US',
				expect.objectContaining({
					name: 'en-US.json',
					path: join(tempDir, 'en-US.json'),
				}),
			);
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});
});
