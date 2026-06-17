import { existsSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { Logger } from '../src';

type LoggerStatics = {
	createdDir?: true;
	fileNames: Partial<Record<string, string>>;
	streams: Record<string, { close: (callback: (error?: NodeJS.ErrnoException | null) => void) => void }>;
};

describe('Logger file output', () => {
	let cwd: string | undefined;
	let tempDir: string | undefined;
	const statics = Logger as unknown as LoggerStatics;
	let createdDir: true | undefined;
	let fileNames: LoggerStatics['fileNames'];
	let streams: LoggerStatics['streams'];

	afterEach(async () => {
		vi.restoreAllMocks();

		if (tempDir && process.cwd() === tempDir) {
			if (existsSync(join(tempDir, Logger.dirname))) await Logger.clearLogs();
			if (cwd) process.chdir(cwd);
			rmSync(tempDir, { recursive: true, force: true });
		}

		statics.createdDir = createdDir;
		statics.fileNames = fileNames;
		statics.streams = streams;
		cwd = undefined;
		tempDir = undefined;
	});

	test('caches an existing log directory after the first file write', () => {
		cwd = process.cwd();
		tempDir = mkdtempSync(join(tmpdir(), 'seyfert-logger-'));
		process.chdir(tempDir);
		mkdirSync(join(tempDir, Logger.dirname), { recursive: true });
		createdDir = statics.createdDir;
		fileNames = statics.fileNames;
		streams = statics.streams;
		statics.createdDir = undefined;
		statics.fileNames = {};
		statics.streams = {};
		vi.spyOn(console, 'log').mockImplementation(() => undefined);

		const logger = new Logger({ name: 'existing-dir', saveOnFile: true });

		logger.info('hello');

		expect(statics.createdDir).toBe(true);
	});
});
