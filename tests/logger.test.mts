import { existsSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { Client, Logger, WorkerClient } from '../src';
import type { SeyfertPlugin } from '../src/client/plugins';
import { LogLevels } from '../src/common';
import type { WorkerData } from '../src/websocket';

function runtimeConfig() {
	return {
		token: 'header.payload.signature',
		locations: { base: process.cwd() },
		intents: 0,
	};
}

type LoggerStatics = {
	createdDir?: true;
	fileNames: Partial<Record<string, string>>;
	streams: Record<string, { close: (callback: (error?: NodeJS.ErrnoException | null) => void) => void }>;
};

type HandlerWithLogger = {
	logger: Logger;
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

describe('client logger options', () => {
	test('applies plugin logger fragments before user logger options without replacing captured loggers', () => {
		const plugin: SeyfertPlugin = {
			name: 'logger-plugin',
			options: () => ({
				logger: {
					active: false,
					logLevel: LogLevels.Error,
					name: 'plugin',
				},
			}),
		};

		const client = new Client({
			getRC: runtimeConfig,
			logger: {
				logLevel: LogLevels.Warn,
				name: 'user',
			},
			plugins: [plugin],
		});

		const commandLogger = (client.commands as unknown as HandlerWithLogger).logger;

		expect(client.logger).toBe(commandLogger);
		expect(client.logger.active).toBe(false);
		expect(client.logger.level).toBe(LogLevels.Warn);
		expect(client.logger.name).toBe('user');
	});

	test('worker start keeps captured logger instance and applies worker logger defaults', async () => {
		const client = new WorkerClient({
			getRC: runtimeConfig,
			logger: {
				active: false,
				logLevel: LogLevels.Warn,
			},
			postMessage: () => undefined,
		});
		client.setWorkerData({
			compress: false,
			debug: false,
			info: {} as WorkerData['info'],
			intents: 0,
			mode: 'custom',
			path: '',
			resharding: false,
			shards: [],
			token: 'header.payload.signature',
			totalShards: 1,
			totalWorkers: 1,
			workerId: 7,
			workerProxy: false,
		});
		const commandLogger = (client.commands as unknown as HandlerWithLogger).logger;

		await client.start();

		expect(client.logger).toBe(commandLogger);
		expect(client.logger.active).toBe(false);
		expect(client.logger.level).toBe(LogLevels.Warn);
		expect(client.logger.name).toBe('[Worker #7]');
	});
});
