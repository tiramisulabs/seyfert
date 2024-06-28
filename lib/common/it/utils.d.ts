import { type ColorResolvable, type Logger, type ObjectToLower, type ObjectToSnake } from '..';
/**
 * Resolves the color to a numeric representation.
 * @param color The color to resolve.
 * @returns The numeric representation of the color.
 */
export declare function resolveColor(color: ColorResolvable): number;
/**
 * Delays the resolution of a Promise by the specified time.
 * @param time The time in milliseconds to delay the resolution.
 * @param result The value to resolve with after the delay.
 * @returns A Promise that resolves after the specified time with the provided result.
 */
export declare function delay<T>(time: number, result?: T): Promise<T>;
/**
 * Checks if a given value is an object.
 * @param o The value to check.
 * @returns `true` if the value is an object, otherwise `false`.
 */
export declare function isObject(o: any): o is Record<string, unknown>;
/**
 * Merges multiple options objects together, deeply extending objects.
 * @param defaults The default options object.
 * @param options Additional options objects to merge.
 * @returns The merged options object.
 */
export declare function MergeOptions<T>(defaults: any, ...options: any[]): T;
/**
 * Splits an array into two arrays based on the result of a predicate function.
 * @param arr The array to split.
 * @param func The predicate function used to test elements of the array.
 * @returns An object containing two arrays: one with elements that passed the test and one with elements that did not.
 */
export declare function filterSplit<Element, Predicate extends (value: Element) => boolean>(arr: Element[], func: Predicate): {
    expect: Element[];
    never: Element[];
};
/**
 * Represents a base handler class.
 */
export declare class BaseHandler {
    protected logger: Logger;
    /**
     * Initializes a new instance of the BaseHandler class.
     * @param logger The logger instance.
     */
    constructor(logger: Logger);
    /**
     * Filters a file path.
     * @param path The path to filter.
     * @returns `true` if the path passes the filter, otherwise `false`.
     */
    protected filter: (path: string) => boolean;
    /**
     * Recursively retrieves all files in a directory.
     * @param dir The directory path.
     * @returns A Promise that resolves to an array of file paths.
     */
    protected getFiles(dir: string): Promise<string[]>;
    /**
     * Loads files from given paths.
     * @param paths The paths of the files to load.
     * @returns A Promise that resolves to an array of loaded files.
     */
    protected loadFiles<T extends NonNullable<unknown>>(paths: string[]): Promise<T[]>;
    /**
     * Loads files from given paths along with additional information.
     * @param paths The paths of the files to load.
     * @returns A Promise that resolves to an array of objects containing name, file, and path.
     */
    protected loadFilesK<T>(paths: string[]): Promise<{
        name: string;
        file: T;
        path: string;
    }[]>;
}
/**
 * Convert a camelCase object to snake_case.
 * @param target The object to convert.
 * @returns The converted object.
 */
export declare function toSnakeCase<Obj extends Record<string, any>>(target: Obj): ObjectToSnake<Obj>;
/**
 * Convert a snake_case object to camelCase.
 * @param target The object to convert.
 * @returns The converted object.
 */
export declare function toCamelCase<Obj extends Record<string, any>>(target: Obj): ObjectToLower<Obj>;
export declare const ReplaceRegex: {
    camel: (s: string) => string;
    snake: (s: string) => string;
};
export declare function magicImport(path: string): Promise<any>;
export type OnFailCallback = (error: unknown) => any;
export declare function fakePromise<T = unknown | Promise<unknown>>(value: T): {
    then<R>(callback: (arg: Awaited<T>) => R): R;
};
export declare function lazyLoadPackage<T>(mod: string): T | undefined;
export declare function isCloudfareWorker(): boolean;
