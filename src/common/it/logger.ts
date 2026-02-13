import { createWriteStream, existsSync, mkdirSync, promises, type WriteStream } from 'node:fs';
import { join } from 'node:path';
import { bgBrightWhite, black, bold, brightBlack, cyan, gray, italic, red, stripColor, yellow } from './colors';
import { MergeOptions } from './utils';
export enum LogLevels {
	Debug = 0,
	Info = 1,
	Warn = 2,
	Error = 3,
	Fatal = 4,
}

export type LoggerOptions = {
	logLevel?: LogLevels;
	name?: string;
	active?: boolean;
	saveOnFile?: boolean;
};

export type CustomizeLoggerCallback = (self: Logger, level: LogLevels, args: unknown[]) => unknown[] | undefined;
export type AssignFilenameCallback = (self: Logger) => string;

/**
 * Represents a logger utility for logging messages with various log levels.
 */
export class Logger {
	/**
	 * The options for configuring the logger.
	 */
	readonly options: Required<LoggerOptions>;

	static saveOnFile?: string[] | 'all';
	static dirname = 'seyfert-logs';

	private static streams: Partial<Record<string, WriteStream>> = {};
	private static fileNames: Partial<Record<string, string>> = {};
	private static createdDir?: true;

	private static __assignFileName: AssignFilenameCallback = self => {
		const date = new Date();
		return `${self.name}-${date.getMonth() + 1}-${date.getDate()}-${date.getFullYear()}-${date.getTime()}.log`;
	};

	/**
	 * The custom callback function for logging.
	 */
	private static __callback: CustomizeLoggerCallback = (self, level, args) => {
		const color = Logger.colorFunctions.get(level) ?? Logger.noColor;
		const memoryData = process.memoryUsage?.();
		const date = new Date();
		return [
			brightBlack(formatMemoryUsage(memoryData?.rss ?? 0)),
			bgBrightWhite(black(`[${date.toLocaleDateString()} ${date.toLocaleTimeString()}]`)),
			color(Logger.prefixes.get(level) ?? 'DEBUG'),
			self.name ? `${self.name} >` : '>',
			...args,
		];
	};

	/**
	 * Allows customization of the logging behavior by providing a custom callback function.
	 * @param cb The custom callback function for logging.
	 * @example
	 * Logger.customize((logger, level, args) => {
	 *     // Custom logging implementation
	 * });
	 */
	static customize(cb: CustomizeLoggerCallback) {
		Logger.__callback = cb;
	}

	/**
	 * Customizes the logging filename by providing a callback function.
	 * The callback receives the logger instance and should return the desired filename.
	 *
	 * @param cb - A function that takes the logger instance and returns a string
	 *              representing the customized filename for the log.
	 * @example
	 * Logger.customizeFilename((logger) => {
	 *     return `${logger.name}-${Date.now()}.log`;
	 * });
	 */
	static customizeFilename(cb: AssignFilenameCallback) {
		Logger.__assignFileName = cb;
	}

	static async clearLogs() {
		for (const i of await promises.readdir(join(process.cwd(), Logger.dirname), { withFileTypes: true })) {
			if (Logger.streams[i.name])
				await new Promise((res, rej) =>
					Logger.streams[i.name]!.close(err => {
						if (err) return rej(err);
						res(err);
					}),
				);
			await promises.unlink(join(process.cwd(), Logger.dirname, i.name)).catch(() => undefined);
			delete Logger.streams[i.name];
		}
	}

	/**
	 * Constructs a new Logger instance with the provided options.
	 * @param options The options for configuring the logger.
	 */
	constructor(options: LoggerOptions) {
		this.options = MergeOptions(Logger.DEFAULT_OPTIONS, options);
	}

	/**
	 * Sets the log level of the logger.
	 */
	set level(level: LogLevels) {
		this.options.logLevel = level;
	}

	/**
	 * Gets the log level of the logger.
	 */
	get level(): LogLevels {
		return this.options.logLevel;
	}

	set saveOnFile(saveOnFile: boolean) {
		this.options.saveOnFile = saveOnFile;
	}

	get saveOnFile(): boolean {
		return this.options.saveOnFile;
	}

	/**
	 * Sets whether the logger is active or not.
	 */
	set active(active: boolean) {
		this.options.active = active;
	}

	/**
	 * Gets whether the logger is active or not.
	 */
	get active(): boolean {
		return this.options.active;
	}

	/**
	 * Sets the name of the logger.
	 */
	set name(name: string) {
		this.options.name = name;
	}

	/**
	 * Gets the name of the logger.
	 */
	get name(): string {
		return this.options.name;
	}

	/**
	 * Logs a message with the specified log level.
	 * @param level The log level.
	 * @param args The arguments to log.
	 * @returns The logged message.
	 */
	rawLog(level: LogLevels, ...args: unknown[]) {
		if (!this.active) return;
		if (level < this.level) return;
		const log = Logger.__callback(this, level, args);
		if (!log) return;
		this.__write(log);
		return console.log(...log);
	}

	/**
	 * Logs a debug message.
	 * @param args The arguments to log.
	 */
	debug(...args: any[]) {
		this.rawLog(LogLevels.Debug, ...args);
	}

	/**
	 * Logs an info message.
	 * @param args The arguments to log.
	 */
	info(...args: any[]) {
		this.rawLog(LogLevels.Info, ...args);
	}

	/**
	 * Logs a warning message.
	 * @param args The arguments to log.
	 */
	warn(...args: any[]) {
		this.rawLog(LogLevels.Warn, ...args);
	}

	/**
	 * Logs an error message.
	 * @param args The arguments to log.
	 */
	error(...args: any[]) {
		this.rawLog(LogLevels.Error, ...args);
	}

	/**
	 * Logs a fatal error message.
	 * @param args The arguments to log.
	 */
	fatal(...args: any[]) {
		this.rawLog(LogLevels.Fatal, ...args);
	}

	private __write(log: unknown[]) {
		if (this.saveOnFile || Logger.saveOnFile === 'all' || Logger.saveOnFile?.includes(this.name)) {
			if (!(Logger.createdDir || existsSync(join(process.cwd(), Logger.dirname)))) {
				Logger.createdDir = true;
				mkdirSync(join(process.cwd(), Logger.dirname), { recursive: true });
			}

			const fileName = (Logger.fileNames[this.name] ??= (() => {
				return (Logger.fileNames[this.name] = Logger.__assignFileName(this));
			})());

			if (!Logger.streams[fileName]) {
				Logger.streams[fileName] = createWriteStream(join(process.cwd(), Logger.dirname, fileName));
			}
			Logger.streams[fileName]!.write(`${stripColor(log.join(' '))}\n`);
		}
	}

	/**
	 * The default options for the logger.
	 */
	static DEFAULT_OPTIONS: Required<LoggerOptions> = {
		logLevel: LogLevels.Debug,
		name: 'seyfert',
		active: true,
		saveOnFile: false,
	};

	/**
	 * A function that returns the input string as is, without any color modification.
	 * @param msg The message to log.
	 * @returns The input message as is.
	 */
	static noColor(msg: string) {
		return msg;
	}

	/**
	 * A map containing color functions for different log levels.
	 */
	static colorFunctions = new Map<LogLevels, (str: string) => string>([
		[LogLevels.Debug, gray],
		[LogLevels.Info, cyan],
		[LogLevels.Warn, yellow],
		[LogLevels.Error, red],
		[LogLevels.Fatal, (str: string) => red(bold(italic(str)))],
	]);

	/**
	 * A map containing prefixes for different log levels.
	 */
	static prefixes = new Map<LogLevels, string>([
		[LogLevels.Debug, 'DEBUG'],
		[LogLevels.Info, 'INFO'],
		[LogLevels.Warn, 'WARN'],
		[LogLevels.Error, 'ERROR'],
		[LogLevels.Fatal, 'FATAL'],
	]);
}

/**
 * Formats memory usage data into a string.
 * @param data The memory usage data.
 * @returns The formatted string representing memory usage.
 */
export function formatMemoryUsage(bytes: number) {
	const gigaBytes = bytes / 1024 ** 3;
	if (gigaBytes >= 1) {
		return `[RAM Usage ${gigaBytes.toFixed(3)} GB]`;
	}

	const megaBytes = bytes / 1024 ** 2;
	if (megaBytes >= 1) {
		return `[RAM Usage ${megaBytes.toFixed(2)} MB]`;
	}

	const kiloBytes = bytes / 1024;
	if (kiloBytes >= 1) {
		return `[RAM Usage ${kiloBytes.toFixed(2)} KB]`;
	}

	return `[RAM Usage ${bytes.toFixed(2)} B]`;
}
