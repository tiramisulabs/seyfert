import type { ObjectToLower, ObjectToSnake } from "@biscuitland/common";
import { DiscordEpoch } from "@biscuitland/common";
import { ImageFormat } from "@biscuitland/common";
import type { ImageSize } from "./types";

/**
 * Convert a timestamp to a snowflake.
 * @param timestamp The timestamp to convert.
 * @returns The snowflake.
 */
export function snowflakeToTimestamp(id: string): number {
	return (Number(id) >> 22) + DiscordEpoch;
}

/**
 * Convert a camelCase object to snake_case.
 * @param target The object to convert.
 * @returns The converted object.
 */
export async function toSnakeCase<Obj extends { [k: string]: unknown }>(target: Obj): Promise<ObjectToSnake<Obj>> {
	const result = {};
	for (const [key, value] of Object.entries(target)) {
		switch (typeof value) {
			case "string":
			case "bigint":
			case "boolean":
			case "function":
			case "symbol":
			case "undefined":
				result[replace.camel(key)] = value;
				break;
			case "object":
				if (Array.isArray(value)) {
					result[replace.camel(key)] = Promise.all(value.map((prop) => toSnakeCase(prop)));
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

/**
 * Convert a snake_case object to camelCase.
 * @param target The object to convert.
 * @returns The converted object.
 */
export async function toCamelCase<Obj extends { [k: string]: unknown }>(target: Obj): Promise<ObjectToLower<Obj>> {
	const result = {};
	for (const [key, value] of Object.entries(target)) {
		switch (typeof value) {
			case "string":
			case "bigint":
			case "boolean":
			case "function":
			case "symbol":
			case "undefined":
				result[replace.snake(key)] = value;
				break;
			case "object":
				if (Array.isArray(value)) {
					result[replace.snake(key)] = Promise.all(value.map((prop) => toCamelCase(prop)));
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
	snake: (s: string) => {
		return s.replace(/(_\S)/gi, (a) => a[1].toUpperCase());
	},
	camel: (s: string) => {
		return s.replace(/[A-Z]/g, (a) => `_${a.toLowerCase()}`);
	},
};

/**
 * Format an image URL.
 * @param url The URL to format.
 * @param size The size of the image.
 * @param format The format of the image.
 * @returns The formatted URL.
 */
export function formatImageURL(url: string, size: ImageSize = 128, format?: ImageFormat): string {
	return `${url}.${format ?? (url.includes("/a_") ? "gif" : "jpg")}?size=${size}`;
}

/**
 * Get the bot ID from a token.
 * @param token The token to get the bot ID from.
 * @returns The bot ID.
 * @warning Discord staff has mentioned this may not be stable forever xd.
 */
export function getBotIdFromToken(token: string): string {
	return Buffer.from(token.split(".")[0], "base64").toString("ascii");
}

/**
 * Convert an object to a URLSearchParams object.
 * @param obj The object to convert.
 * @returns The URLSearchParams object.
 */
export function objectToParams(obj: object): URLSearchParams {
	const query = new URLSearchParams();
	for (const [key, value] of Object.entries(obj)) {
		if (!value) continue;
		query.append(replace.camel(key), String(value));
	}

	return query;
}

/**
 * Get the channel link from a channel ID and guild ID.
 *
 * @param channelId The channel ID.
 * @param guildId The guild ID.
 * @returns The channel link.
 */
export function channelLink(channelId: string, guildId?: string) {
	return `https://discord.com/channels/${guildId ?? "@me"}/${channelId}`;
}
