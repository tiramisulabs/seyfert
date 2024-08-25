import { promises } from 'node:fs';
import { basename, join } from 'node:path';
import {
	DiscordEpoch,
	EmbedColors,
	type EmojiResolvable,
	type TypeArray,
	type ColorResolvable,
	type Logger,
	type ObjectToLower,
	type ObjectToSnake,
} from '..';
import { type APIPartialEmoji, FormattingPatterns } from '../../types';
import type { Cache } from '../../cache';

/**
 * Calculates the shard ID for a guild based on its ID.
 * @param guildId The ID of the guild.
 * @param shards The number of shards to calculate the ID for.
 * @returns The shard ID.
 */
export function calculateShardId(guildId: string, shards?: number) {
	return Number((BigInt(guildId) >> 22n) % BigInt(shards ?? 1));
}
/**
 * Resolves the color to a numeric representation.
 * @param color The color to resolve.
 * @returns The numeric representation of the color.
 */
export function resolveColor(color: ColorResolvable): number {
	switch (typeof color) {
		case 'string':
			if (color === 'Random') return Math.floor(Math.random() * (0xffffff + 1));
			if (color.startsWith('#')) return Number.parseInt(color.slice(1), 16);
			if (color in EmbedColors) return EmbedColors[color as keyof typeof EmbedColors];
			return EmbedColors.Default;
		case 'number':
			return color;
		case 'object':
			if (Array.isArray(color)) return (color[0] << 16) + (color[1] << 8) + color[2];
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
export function delay<T>(time: number, result?: T): Promise<T> {
	return new Promise(r => setTimeout(r, time, result));
}

/**
 * Checks if a given value is an object.
 * @param o The value to check.
 * @returns `true` if the value is an object, otherwise `false`.
 */
export function isObject(o: any): o is Record<string, unknown> {
	return o && typeof o === 'object' && !Array.isArray(o);
}

/**
 * Merges multiple options objects together, deeply extending objects.
 * @param defaults The default options object.
 * @param options Additional options objects to merge.
 * @returns The merged options object.
 */
export function MergeOptions<T>(defaults: any, ...options: any[]): T {
	const option = options.shift();
	if (!option) {
		return defaults;
	}

	return MergeOptions(
		{
			...option,
			...Object.fromEntries(
				Object.entries(defaults).map(([key, value]) => [
					key,
					isObject(value) ? MergeOptions(value, option?.[key] || {}) : option?.[key] ?? value,
				]),
			),
		},
		...options,
	);
}

/**
 * Splits an array into two arrays based on the result of a predicate function.
 * @param arr The array to split.
 * @param func The predicate function used to test elements of the array.
 * @returns An object containing two arrays: one with elements that passed the test and one with elements that did not.
 */
export function filterSplit<Element, Predicate extends (value: Element) => boolean>(arr: Element[], func: Predicate) {
	const expect: Element[] = [];
	const never: Element[] = [];

	for (const element of arr) {
		const test = func(element);
		if (test) expect.push(element);
		else never.push(element);
	}

	return { expect, never };
}

/**
 * Represents a base handler class.
 */
export class BaseHandler {
	/**
	 * Initializes a new instance of the BaseHandler class.
	 * @param logger The logger instance.
	 */
	constructor(protected logger: Logger) {}

	/**
	 * Filters a file path.
	 * @param path The path to filter.
	 * @returns `true` if the path passes the filter, otherwise `false`.
	 */
	protected filter = (path: string) => !!path;

	/**
	 * Recursively retrieves all files in a directory.
	 * @param dir The directory path.
	 * @returns A Promise that resolves to an array of file paths.
	 */
	protected async getFiles(dir: string) {
		const files: string[] = [];

		for (const i of await promises.readdir(dir, { withFileTypes: true })) {
			if (i.isDirectory()) {
				files.push(...(await this.getFiles(join(dir, i.name))));
			} else if (this.filter(join(dir, i.name))) {
				files.push(join(dir, i.name));
			}
		}

		return files;
	}

	/**
	 * Loads files from given paths.
	 * @param paths The paths of the files to load.
	 * @returns A Promise that resolves to an array of loaded files.
	 */
	protected loadFiles<T extends NonNullable<unknown>>(paths: string[]): Promise<T[]> {
		return Promise.all(paths.map(path => magicImport(path).then(file => file.default ?? file)));
	}

	/**
	 * Loads files from given paths along with additional information.
	 * @param paths The paths of the files to load.
	 * @returns A Promise that resolves to an array of objects containing name, file, and path.
	 */
	protected loadFilesK<T>(paths: string[]): Promise<{ name: string; file: T; path: string }[]> {
		return Promise.all(
			paths.map(path =>
				magicImport(path).then(file => {
					return {
						name: basename(path),
						file,
						path,
					};
				}),
			),
		);
	}
}

/**
 * Convert a camelCase object to snake_case.
 * @param target The object to convert.
 * @returns The converted object.
 */
export function toSnakeCase<Obj extends Record<string, any>>(target: Obj): ObjectToSnake<Obj> {
	const result: Record<string, any> = {};
	for (const [key, value] of Object.entries(target)) {
		switch (typeof value) {
			case 'string':
			case 'bigint':
			case 'boolean':
			case 'function':
			case 'number':
			case 'symbol':
			case 'undefined':
				result[ReplaceRegex.snake(key)] = value;
				break;
			case 'object':
				if (Array.isArray(value)) {
					result[ReplaceRegex.snake(key)] = value.map(prop =>
						typeof prop === 'object' && prop ? toSnakeCase(prop) : prop,
					);
					break;
				}
				if (isObject(value)) {
					result[ReplaceRegex.snake(key)] = toSnakeCase(value);
					break;
				}
				if (!Number.isNaN(value)) {
					result[ReplaceRegex.snake(key)] = null;
					break;
				}
				result[ReplaceRegex.snake(key)] = toSnakeCase(value);
				break;
		}
	}
	return result as ObjectToSnake<Obj>;
}

/**
 * Convert a snake_case object to camelCase.
 * @param target The object to convert.
 * @returns The converted object.
 */
export function toCamelCase<Obj extends Record<string, any>>(target: Obj): ObjectToLower<Obj> {
	const result: Record<string, any> = {};
	for (const [key, value] of Object.entries(target)) {
		switch (typeof value) {
			case 'string':
			case 'bigint':
			case 'boolean':
			case 'function':
			case 'symbol':
			case 'number':
			case 'undefined':
				result[ReplaceRegex.camel(key)] = value;
				break;
			case 'object':
				if (Array.isArray(value)) {
					result[ReplaceRegex.camel(key)] = value.map(prop =>
						typeof prop === 'object' && prop ? toCamelCase(prop) : prop,
					);
					break;
				}
				if (isObject(value)) {
					result[ReplaceRegex.camel(key)] = toCamelCase(value);
					break;
				}
				if (!Number.isNaN(value)) {
					result[ReplaceRegex.camel(key)] = null;
					break;
				}
				result[ReplaceRegex.camel(key)] = toCamelCase(value);
				break;
		}
	}
	return result as ObjectToLower<Obj>;
}

export const ReplaceRegex = {
	camel: (s: string) => {
		return s.toLowerCase().replace(/(_\S)/gi, a => a[1].toUpperCase());
	},
	snake: (s: string) => {
		return s.replace(/[A-Z]/g, a => `_${a.toLowerCase()}`);
	},
};

export async function magicImport(path: string) {
	try {
		return require(path);
	} catch {
		return eval('((path) => import(`file:///${path}?update=${Date.now()}`))')(path.split('\\').join('\\\\'));
	}
}

export type OnFailCallback = (error: unknown) => any;

export function fakePromise<T = unknown | Promise<unknown>>(
	value: T,
): {
	then<R>(callback: (arg: Awaited<T>) => R): R;
} {
	if (value instanceof Promise) return value as any;
	return {
		then: callback => callback(value as Awaited<T>),
	};
}

export function lazyLoadPackage<T>(mod: string): T | undefined {
	try {
		return require(mod);
	} catch (e) {
		console.log(`Cannot import ${mod}`);
		return;
	}
}

export function isCloudfareWorker() {
	//@ts-expect-error
	return process.platform === 'browser';
}

/**
 *
 * Convert a timestamp to a snowflake.
 * @param id The timestamp to convert.
 * @returns The snowflake.
 */
export function snowflakeToTimestamp(id: string): bigint {
	return (BigInt(id) >> 22n) + DiscordEpoch;
}

export function resolvePartialEmoji(emoji: EmojiResolvable): APIPartialEmoji | undefined {
	if (typeof emoji === 'string') {
		const groups: Partial<APIPartialEmoji> | undefined = emoji.match(FormattingPatterns.Emoji)?.groups;
		if (groups) {
			return { animated: !!groups.animated, name: groups.name!, id: groups.id! };
		}
		if (emoji.includes('%')) {
			emoji = encodeURIComponent(emoji);
		}
		if (!(emoji.includes(':') || emoji.match(/\d{17,20}/g))) {
			return { name: emoji, id: null };
		}
		return;
	}

	if (!(emoji.id && emoji.name)) return;
	return { id: emoji.id, name: emoji.name, animated: !!emoji.animated };
}

export async function resolveEmoji(emoji: EmojiResolvable, cache: Cache): Promise<APIPartialEmoji | undefined> {
	const partial = resolvePartialEmoji(emoji);
	if (partial) return partial;

	if (typeof emoji === 'string') {
		if (!emoji.match(/\d{17,20}/g)) return;
		const fromCache = await cache.emojis?.get(emoji);
		return fromCache && { animated: fromCache.animated, id: fromCache.id, name: fromCache.name };
	}

	const fromCache = await cache.emojis?.get(emoji.id!);
	if (fromCache) return { animated: fromCache.animated, id: fromCache.id, name: fromCache.name };
	return;
}

export function encodeEmoji(rawEmoji: APIPartialEmoji) {
	return rawEmoji.id ? `${rawEmoji.name}:${rawEmoji.id}` : `${rawEmoji.name}`;
}

export function hasProps<T extends Record<any, any>>(target: T, props: TypeArray<keyof T>): boolean {
	if (Array.isArray(props)) {
		return props.every(x => hasProps(target, x));
	}
	if (!((props as T[number]) in target)) {
		return false;
	}
	if (typeof target[props] === 'string' && !target[props as T[number]].length) {
		return false;
	}
	return true;
}
