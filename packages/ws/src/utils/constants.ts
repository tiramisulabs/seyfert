import process from "node:process";
import { lazy } from "@discordjs/util";
import { APIVersion, GatewayOpcodes } from "discord-api-types/v10";
import type { SessionInfo, OptionalWebSocketManagerOptions } from "../ws/WebSocketManager.js";
import type { SendRateLimitState } from "../ws/WebSocketShard.js";

/**
 * Valid encoding types
 */
export enum Encoding {
	JSON = "json",
}

export const DefaultDeviceProperty = "@discordjs/ws [VI]{{inject}}[/VI]" as `@discordjs/ws ${string}`;

const getDefaultSessionStore = lazy(() => new Map<number, SessionInfo | null>());

/**
 * Default options used by the manager
 */
export const DefaultWebSocketManagerOptions = {
	shardCount: null,
	shardIds: null,
	largeThreshold: null,
	initialPresence: null,
	identifyProperties: {
		browser: DefaultDeviceProperty,
		device: DefaultDeviceProperty,
		os: process.platform,
	},
	version: APIVersion,
	encoding: Encoding.JSON,
	retrieveSessionInfo(shardId) {
		const store = getDefaultSessionStore();
		return store.get(shardId) ?? null;
	},
	updateSessionInfo(shardId: number, info: SessionInfo | null) {
		const store = getDefaultSessionStore();
		if (info) {
			store.set(shardId, info);
		} else {
			store.delete(shardId);
		}
	},
	handshakeTimeout: 30_000,
	helloTimeout: 60_000,
	readyTimeout: 15_000,
} as OptionalWebSocketManagerOptions;

export const ImportantGatewayOpcodes = new Set([
	GatewayOpcodes.Heartbeat,
	GatewayOpcodes.Identify,
	GatewayOpcodes.Resume,
]);

export function getInitialSendRateLimitState(): SendRateLimitState {
	return {
		remaining: 120,
		resetAt: Date.now() + 60_000,
	};
}

/**
 * For some reason range of @discordjs/util doesn't come like this
 */

/**
 * Options for creating a range
 */
export interface RangeOptions {
	/**
	 * The end of the range (exclusive)
	 */
	end: number;
	/**
	 * The start of the range (inclusive)
	 */
	start: number;
	/**
	 * The amount to increment by
	 *
	 * @defaultValue `1`
	 */
	step?: number;
}

/**
 * A generator to yield numbers in a given range
 *
 * @remarks
 * This method is end-exclusive, for example the last number yielded by `range(5)` is 4. If you
 * prefer for the end to be included add 1 to the range or `end` option.
 * @param range - A number representing the the range to yield (exclusive) or an object with start, end and step
 * @example
 * Basic range
 * ```ts
 * for (const number of range(5)) {
 *  console.log(number);
 * }
 * // Prints 0, 1, 2, 3, 4
 * ```
 * @example
 * Range with a step
 * ```ts
 * for (const number of range({ start: 3, end: 10, step: 2 })) {
 * 	console.log(number);
 * }
 * // Prints 3, 5, 7, 9
 * ```
 */
export function* range(range: RangeOptions | number) {
	let rangeEnd: number;
	let start = 0;
	let step = 1;

	if (typeof range === "number") {
		rangeEnd = range;
	} else {
		start = range.start;
		rangeEnd = range.end;
		step = range.step ?? 1;
	}

	for (let index = start; index < rangeEnd; index += step) {
		yield index;
	}
}
