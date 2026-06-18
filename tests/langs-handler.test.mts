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

	test('accepts raw object modules without warning', () => {
		const { handler, warn } = createHandler();
		const raw = { command: { name: 'Raw' } };

		handler.parse({
			name: 'raw.ts',
			path: '/langs/raw.ts',
			file: raw as never,
		});

		expect(handler.values.raw).toBe(raw);
		expect(warn).not.toHaveBeenCalled();
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
		expect(warn).toHaveBeenCalledWith(
			expect.stringContaining('/langs/invalid.ts'),
			expect.stringContaining('value'),
		);
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
