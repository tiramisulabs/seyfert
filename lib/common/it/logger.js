"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = exports.LogLevels = void 0;
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const colors_1 = require("./colors");
const utils_1 = require("./utils");
var LogLevels;
(function (LogLevels) {
    LogLevels[LogLevels["Debug"] = 0] = "Debug";
    LogLevels[LogLevels["Info"] = 1] = "Info";
    LogLevels[LogLevels["Warn"] = 2] = "Warn";
    LogLevels[LogLevels["Error"] = 3] = "Error";
    LogLevels[LogLevels["Fatal"] = 4] = "Fatal";
})(LogLevels || (exports.LogLevels = LogLevels = {}));
/**
 * Represents a logger utility for logging messages with various log levels.
 */
class Logger {
    /**
     * The options for configuring the logger.
     */
    options;
    static streams = {};
    static saveOnFile;
    static dirname = 'seyfert-logs';
    static createdDir;
    /**
     * The custom callback function for logging.
     */
    static __callback;
    /**
     * Allows customization of the logging behavior by providing a custom callback function.
     * @param cb The custom callback function for logging.
     * @example
     * Logger.customize((logger, level, args) => {
     *     // Custom logging implementation
     * });
     */
    static customize(cb) {
        Logger.__callback = cb;
    }
    static async clearLogs() {
        for (const i of await node_fs_1.promises.readdir((0, node_path_1.join)(process.cwd(), Logger.dirname), { withFileTypes: true })) {
            if (this.streams[i.name])
                await new Promise(res => this.streams[i.name].close(res));
            await node_fs_1.promises.unlink((0, node_path_1.join)(process.cwd(), Logger.dirname, i.name)).catch(() => { });
            delete this.streams[i.name];
        }
    }
    /**
     * Constructs a new Logger instance with the provided options.
     * @param options The options for configuring the logger.
     */
    constructor(options) {
        this.options = (0, utils_1.MergeOptions)(Logger.DEFAULT_OPTIONS, options);
    }
    /**
     * Sets the log level of the logger.
     */
    set level(level) {
        this.options.logLevel = level;
    }
    /**
     * Gets the log level of the logger.
     */
    get level() {
        return this.options.logLevel;
    }
    set saveOnFile(saveOnFile) {
        this.options.saveOnFile = saveOnFile;
    }
    get saveOnFile() {
        return this.options.saveOnFile;
    }
    /**
     * Sets whether the logger is active or not.
     */
    set active(active) {
        this.options.active = active;
    }
    /**
     * Gets whether the logger is active or not.
     */
    get active() {
        return this.options.active;
    }
    /**
     * Sets the name of the logger.
     */
    set name(name) {
        this.options.name = name;
    }
    /**
     * Gets the name of the logger.
     */
    get name() {
        return this.options.name;
    }
    /**
     * Logs a message with the specified log level.
     * @param level The log level.
     * @param args The arguments to log.
     * @returns The logged message.
     */
    rawLog(level, ...args) {
        if (!this.active)
            return;
        if (level < this.level)
            return;
        let log;
        if (Logger.__callback) {
            log = Logger.__callback(this, level, args);
        }
        else {
            const color = Logger.colorFunctions.get(level) ?? Logger.noColor;
            const memoryData = process.memoryUsage?.();
            const date = new Date();
            log = [
                (0, colors_1.brightBlack)(formatMemoryUsage(memoryData?.rss ?? 0)),
                (0, colors_1.bgBrightWhite)((0, colors_1.black)(`[${date.toLocaleDateString()} ${date.toLocaleTimeString()}]`)),
                color(Logger.prefixes.get(level) ?? 'DEBUG'),
                this.name ? `${this.name} >` : '>',
                ...args,
            ];
        }
        if (!log)
            return;
        this.__write(log);
        return console.log(...log);
    }
    /**
     * Logs a debug message.
     * @param args The arguments to log.
     */
    debug(...args) {
        this.rawLog(LogLevels.Debug, ...args);
    }
    /**
     * Logs an info message.
     * @param args The arguments to log.
     */
    info(...args) {
        this.rawLog(LogLevels.Info, ...args);
    }
    /**
     * Logs a warning message.
     * @param args The arguments to log.
     */
    warn(...args) {
        this.rawLog(LogLevels.Warn, ...args);
    }
    /**
     * Logs an error message.
     * @param args The arguments to log.
     */
    error(...args) {
        this.rawLog(LogLevels.Error, ...args);
    }
    /**
     * Logs a fatal error message.
     * @param args The arguments to log.
     */
    fatal(...args) {
        this.rawLog(LogLevels.Fatal, ...args);
    }
    __write(log) {
        if (this.saveOnFile || Logger.saveOnFile === 'all' || Logger.saveOnFile?.includes(this.name)) {
            if (!(Logger.createdDir || (0, node_fs_1.existsSync)((0, node_path_1.join)(process.cwd(), Logger.dirname)))) {
                Logger.createdDir = true;
                (0, node_fs_1.mkdirSync)((0, node_path_1.join)(process.cwd(), Logger.dirname), { recursive: true });
            }
            const date = new Date();
            const name = `${date.getMonth() + 1}-${date.getDate()}-${date.getFullYear()}${this.name}.log`;
            if (!Logger.streams[name]) {
                Logger.streams[name] = (0, node_fs_1.createWriteStream)((0, node_path_1.join)(process.cwd(), Logger.dirname, name));
            }
            Logger.streams[name].write(`${Buffer.from((0, colors_1.stripColor)(log.join(' ')))}\n`);
        }
    }
    /**
     * The default options for the logger.
     */
    static DEFAULT_OPTIONS = {
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
    static noColor(msg) {
        return msg;
    }
    /**
     * A map containing color functions for different log levels.
     */
    static colorFunctions = new Map([
        [LogLevels.Debug, colors_1.gray],
        [LogLevels.Info, colors_1.cyan],
        [LogLevels.Warn, colors_1.yellow],
        [LogLevels.Error, colors_1.red],
        [LogLevels.Fatal, (str) => (0, colors_1.red)((0, colors_1.bold)((0, colors_1.italic)(str)))],
    ]);
    /**
     * A map containing prefixes for different log levels.
     */
    static prefixes = new Map([
        [LogLevels.Debug, 'DEBUG'],
        [LogLevels.Info, 'INFO'],
        [LogLevels.Warn, 'WARN'],
        [LogLevels.Error, 'ERROR'],
        [LogLevels.Fatal, 'FATAL'],
    ]);
}
exports.Logger = Logger;
/**
 * Formats memory usage data into a string.
 * @param data The memory usage data.
 * @returns The formatted string representing memory usage.
 */
function formatMemoryUsage(bytes) {
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
