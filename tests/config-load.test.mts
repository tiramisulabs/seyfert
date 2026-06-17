import { afterEach, describe, expect, test, vi } from 'vitest';
import '../src';
import { BaseClient } from '../src/client/base';
import * as Common from '../src/common';
import { SeyfertError } from '../src/common/it/error';

describe('BaseClient config loading', () => {
	afterEach(() => {
		BaseClient._seyfertCfWorkerConfig = undefined;
		vi.restoreAllMocks();
	});

	function mockConfigImports(resolveError: (path: string) => Error) {
		vi.spyOn(Common, 'magicImport').mockImplementation(async path => {
			throw resolveError(path);
		});
	}

	test('wraps config import failures with SEYFERT_CONFIG_LOAD_ERROR and preserves cause', async () => {
		const importError = new Error('broken config import');
		mockConfigImports(path => (path.endsWith('seyfert.config.mjs') ? importError : new Error(`Cannot find ${path}`)));

		let thrown: unknown;

		try {
			await new BaseClient().getRC();
		} catch (error) {
			thrown = error;
		}

		expect(thrown).toBeInstanceOf(SeyfertError);
		expect(thrown).toMatchObject({
			code: 'SEYFERT_CONFIG_LOAD_ERROR',
			metadata: { detail: 'broken config import' },
		});
		expect((thrown as Error).cause).toBeInstanceOf(Error);
		expect(((thrown as Error).cause as Error).message).toBe('broken config import');
	});

	test('keeps missing config failures as NO_SEYFERT_CONFIG', async () => {
		mockConfigImports(path => new Error(`Cannot find ${path}`));

		let thrown: unknown;

		try {
			await new BaseClient().getRC();
		} catch (error) {
			thrown = error;
		}

		expect(thrown).toBeInstanceOf(SeyfertError);
		expect(thrown).toMatchObject({
			code: 'NO_SEYFERT_CONFIG',
			metadata: { detail: 'No seyfert.config file found' },
		});
	});
});
