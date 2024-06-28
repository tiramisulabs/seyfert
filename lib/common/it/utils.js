"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReplaceRegex = exports.BaseHandler = void 0;
exports.resolveColor = resolveColor;
exports.delay = delay;
exports.isObject = isObject;
exports.MergeOptions = MergeOptions;
exports.filterSplit = filterSplit;
exports.toSnakeCase = toSnakeCase;
exports.toCamelCase = toCamelCase;
exports.magicImport = magicImport;
exports.fakePromise = fakePromise;
exports.lazyLoadPackage = lazyLoadPackage;
exports.isCloudfareWorker = isCloudfareWorker;
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const __1 = require("..");
/**
 * Resolves the color to a numeric representation.
 * @param color The color to resolve.
 * @returns The numeric representation of the color.
 */
function resolveColor(color) {
    switch (typeof color) {
        case 'string':
            if (color === 'Random')
                return Math.floor(Math.random() * (0xffffff + 1));
            if (color.startsWith('#'))
                return Number.parseInt(color.slice(1), 16);
            if (color in __1.EmbedColors)
                return __1.EmbedColors[color];
            return __1.EmbedColors.Default;
        case 'number':
            return color;
        case 'object':
            if (Array.isArray(color))
                return (color[0] << 16) + (color[1] << 8) + color[2];
            break;
        default:
            return color;
    }
    return color;
}
/**
 * Delays the resolution of a Promise by the specified time.
 * @param time The time in milliseconds to delay the resolution.
 * @param result The value to resolve with after the delay.
 * @returns A Promise that resolves after the specified time with the provided result.
 */
function delay(time, result) {
    return new Promise(r => setTimeout(r, time, result));
}
/**
 * Checks if a given value is an object.
 * @param o The value to check.
 * @returns `true` if the value is an object, otherwise `false`.
 */
function isObject(o) {
    return o && typeof o === 'object' && !Array.isArray(o);
}
/**
 * Merges multiple options objects together, deeply extending objects.
 * @param defaults The default options object.
 * @param options Additional options objects to merge.
 * @returns The merged options object.
 */
function MergeOptions(defaults, ...options) {
    const option = options.shift();
    if (!option) {
        return defaults;
    }
    return MergeOptions({
        ...option,
        ...Object.fromEntries(Object.entries(defaults).map(([key, value]) => [
            key,
            isObject(value) ? MergeOptions(value, option?.[key] || {}) : option?.[key] ?? value,
        ])),
    }, ...options);
}
/**
 * Splits an array into two arrays based on the result of a predicate function.
 * @param arr The array to split.
 * @param func The predicate function used to test elements of the array.
 * @returns An object containing two arrays: one with elements that passed the test and one with elements that did not.
 */
function filterSplit(arr, func) {
    const expect = [];
    const never = [];
    for (const element of arr) {
        const test = func(element);
        if (test)
            expect.push(element);
        else
            never.push(element);
    }
    return { expect, never };
}
/**
 * Represents a base handler class.
 */
class BaseHandler {
    logger;
    /**
     * Initializes a new instance of the BaseHandler class.
     * @param logger The logger instance.
     */
    constructor(logger) {
        this.logger = logger;
    }
    /**
     * Filters a file path.
     * @param path The path to filter.
     * @returns `true` if the path passes the filter, otherwise `false`.
     */
    filter = (path) => !!path;
    /**
     * Recursively retrieves all files in a directory.
     * @param dir The directory path.
     * @returns A Promise that resolves to an array of file paths.
     */
    async getFiles(dir) {
        const files = [];
        for (const i of await node_fs_1.promises.readdir(dir, { withFileTypes: true })) {
            if (i.isDirectory()) {
                files.push(...(await this.getFiles((0, node_path_1.join)(dir, i.name))));
            }
            else if (this.filter((0, node_path_1.join)(dir, i.name))) {
                files.push((0, node_path_1.join)(dir, i.name));
            }
        }
        return files;
    }
    /**
     * Loads files from given paths.
     * @param paths The paths of the files to load.
     * @returns A Promise that resolves to an array of loaded files.
     */
    loadFiles(paths) {
        return Promise.all(paths.map(path => magicImport(path).then(file => file.default ?? file)));
    }
    /**
     * Loads files from given paths along with additional information.
     * @param paths The paths of the files to load.
     * @returns A Promise that resolves to an array of objects containing name, file, and path.
     */
    loadFilesK(paths) {
        return Promise.all(paths.map(path => magicImport(path).then(file => {
            return {
                name: (0, node_path_1.basename)(path),
                file,
                path,
            };
        })));
    }
}
exports.BaseHandler = BaseHandler;
/**
 * Convert a camelCase object to snake_case.
 * @param target The object to convert.
 * @returns The converted object.
 */
function toSnakeCase(target) {
    const result = {};
    for (const [key, value] of Object.entries(target)) {
        switch (typeof value) {
            case 'string':
            case 'bigint':
            case 'boolean':
            case 'function':
            case 'number':
            case 'symbol':
            case 'undefined':
                result[exports.ReplaceRegex.snake(key)] = value;
                break;
            case 'object':
                if (Array.isArray(value)) {
                    result[exports.ReplaceRegex.snake(key)] = value.map(prop => typeof prop === 'object' && prop ? toSnakeCase(prop) : prop);
                    break;
                }
                if (isObject(value)) {
                    result[exports.ReplaceRegex.snake(key)] = toSnakeCase(value);
                    break;
                }
                if (!Number.isNaN(value)) {
                    result[exports.ReplaceRegex.snake(key)] = null;
                    break;
                }
                result[exports.ReplaceRegex.snake(key)] = toSnakeCase(value);
                break;
        }
    }
    return result;
}
/**
 * Convert a snake_case object to camelCase.
 * @param target The object to convert.
 * @returns The converted object.
 */
function toCamelCase(target) {
    const result = {};
    for (const [key, value] of Object.entries(target)) {
        switch (typeof value) {
            case 'string':
            case 'bigint':
            case 'boolean':
            case 'function':
            case 'symbol':
            case 'number':
            case 'undefined':
                result[exports.ReplaceRegex.camel(key)] = value;
                break;
            case 'object':
                if (Array.isArray(value)) {
                    result[exports.ReplaceRegex.camel(key)] = value.map(prop => typeof prop === 'object' && prop ? toCamelCase(prop) : prop);
                    break;
                }
                if (isObject(value)) {
                    result[exports.ReplaceRegex.camel(key)] = toCamelCase(value);
                    break;
                }
                if (!Number.isNaN(value)) {
                    result[exports.ReplaceRegex.camel(key)] = null;
                    break;
                }
                result[exports.ReplaceRegex.camel(key)] = toCamelCase(value);
                break;
        }
    }
    return result;
}
exports.ReplaceRegex = {
    camel: (s) => {
        return s.toLowerCase().replace(/(_\S)/gi, a => a[1].toUpperCase());
    },
    snake: (s) => {
        return s.replace(/[A-Z]/g, a => `_${a.toLowerCase()}`);
    },
};
async function magicImport(path) {
    try {
        return require(path);
    }
    catch {
        // biome-ignore lint/security/noGlobalEval: modules import broke
        return eval('((path) => import(`file:///${path}?update=${Date.now()}`))')(path.split('\\').join('\\\\'));
    }
}
function fakePromise(value) {
    if (value instanceof Promise)
        return value;
    return {
        // biome-ignore lint/suspicious/noThenProperty: magic
        then: callback => callback(value),
    };
}
function lazyLoadPackage(mod) {
    try {
        return require(mod);
    }
    catch (e) {
        console.log(`Cannot import ${mod}`);
        return;
    }
}
function isCloudfareWorker() {
    //@ts-expect-error
    return process.platform === 'browser';
}
