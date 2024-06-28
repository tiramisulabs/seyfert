import { type WriteStream } from 'node:fs';
export declare enum LogLevels {
    Debug = 0,
    Info = 1,
    Warn = 2,
    Error = 3,
    Fatal = 4
}
export type LoggerOptions = {
    logLevel?: LogLevels;
    name?: string;
    active?: boolean;
    saveOnFile?: boolean;
};
export type CustomCallback = (self: Logger, level: LogLevels, args: unknown[]) => unknown[] | undefined;
/**
 * Represents a logger utility for logging messages with various log levels.
 */
export declare class Logger {
    /**
     * The options for configuring the logger.
     */
    readonly options: Required<LoggerOptions>;
    static streams: Partial<Record<string, WriteStream>>;
    static saveOnFile?: string[] | 'all';
    static dirname: string;
    private static createdDir?;
    /**
     * The custom callback function for logging.
     */
    private static __callback?;
    /**
     * Allows customization of the logging behavior by providing a custom callback function.
     * @param cb The custom callback function for logging.
     * @example
     * Logger.customize((logger, level, args) => {
     *     // Custom logging implementation
     * });
     */
    static customize(cb: CustomCallback): void;
    static clearLogs(): Promise<void>;
    /**
     * Constructs a new Logger instance with the provided options.
     * @param options The options for configuring the logger.
     */
    constructor(options: LoggerOptions);
    /**
     * Sets the log level of the logger.
     */
    set level(level: LogLevels);
    /**
     * Gets the log level of the logger.
     */
    get level(): LogLevels;
    set saveOnFile(saveOnFile: boolean);
    get saveOnFile(): boolean;
    /**
     * Sets whether the logger is active or not.
     */
    set active(active: boolean);
    /**
     * Gets whether the logger is active or not.
     */
    get active(): boolean;
    /**
     * Sets the name of the logger.
     */
    set name(name: string);
    /**
     * Gets the name of the logger.
     */
    get name(): string;
    /**
     * Logs a message with the specified log level.
     * @param level The log level.
     * @param args The arguments to log.
     * @returns The logged message.
     */
    rawLog(level: LogLevels, ...args: unknown[]): void;
    /**
     * Logs a debug message.
     * @param args The arguments to log.
     */
    debug(...args: any[]): void;
    /**
     * Logs an info message.
     * @param args The arguments to log.
     */
    info(...args: any[]): void;
    /**
     * Logs a warning message.
     * @param args The arguments to log.
     */
    warn(...args: any[]): void;
    /**
     * Logs an error message.
     * @param args The arguments to log.
     */
    error(...args: any[]): void;
    /**
     * Logs a fatal error message.
     * @param args The arguments to log.
     */
    fatal(...args: any[]): void;
    private __write;
    /**
     * The default options for the logger.
     */
    static DEFAULT_OPTIONS: Required<LoggerOptions>;
    /**
     * A function that returns the input string as is, without any color modification.
     * @param msg The message to log.
     * @returns The input message as is.
     */
    static noColor(msg: string): string;
    /**
     * A map containing color functions for different log levels.
     */
    static colorFunctions: Map<LogLevels, (str: string) => string>;
    /**
     * A map containing prefixes for different log levels.
     */
    static prefixes: Map<LogLevels, string>;
}
