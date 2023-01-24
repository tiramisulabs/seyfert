import type { ObjectToLower, ObjectToSnake } from '@biscuitland/common';
import { DiscordEpoch } from '@biscuitland/common';
import type {  ImageFormat } from 'discord-api-types/v10';
import type { ImageSize } from './types';

export function snowflakeToTimestamp(id: string): number {
	return (Number(id) >> 22) + DiscordEpoch;
}

export async function toSnakeCase<Obj extends { [k: string]: unknown}>(target: Obj): Promise<ObjectToSnake<Obj>> {
	const result = {};
	for (const [key, value] of Object.entries(target)) {
		switch (typeof value) {
			case 'string':
			case 'bigint':
			case 'boolean':
			case 'function':
			case 'symbol':
			case 'undefined':
				result[replace.camel(key)] = value;
				break;
			case 'object':
				if (Array.isArray(value)) {
					result[replace.camel(key)] = Promise.all(value.map(prop => toSnakeCase(prop)));
					break;
				}
				if (!Number.isNaN(value)) {
					result[replace.camel(key)] = null;
					break;
				}
				result[replace.camel(key)] = await toSnakeCase({ ...value });
				break;
			}
	}
	return result as ObjectToSnake<Obj>;
}

export async function toCamelCase<Obj extends { [k: string]: unknown}>(target: Obj): Promise<ObjectToLower<Obj>> {
	const result = {};
	for (const [key, value] of Object.entries(target)) {
		switch (typeof value) {
			case 'string':
			case 'bigint':
			case 'boolean':
			case 'function':
			case 'symbol':
			case 'undefined':
				result[replace.snake(key)] = value;
				break;
			case 'object':
				if (Array.isArray(value)) {
					result[replace.snake(key)] = Promise.all(value.map(prop => toCamelCase(prop)));
					break;
				}
				if (!Number.isNaN(value)) {
					result[replace.snake(key)] = null;
					break;
				}
				result[replace.snake(key)] = await toCamelCase({ ...value });
				break;
			}
	}
	return result as ObjectToLower<Obj>;
}

export const replace = {
	snake: (s: string) => { return s.replace(/(_\S)/gi, a => a[1].toUpperCase()); },
	camel: (s: string) => { return s.replace(/[A-Z]/g, a => '_' + a.toLowerCase()); }
};

export function formatImageURL(url: string, size: ImageSize = 128, format?: ImageFormat): string {
	return `${url}.${format ?? (url.includes('/a_') ? 'gif' : 'jpg')}?size=${size}`;
}
