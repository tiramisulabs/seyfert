import type { UsingClient } from '../commands';
import { ReplaceRegex } from '../common';
import * as RawEvents from './hooks';

const rawEventNames = Object.keys(RawEvents);

export function normalizeEventName(name: string) {
	if (isRawEventName(name)) return name;
	const gatewayName = ReplaceRegex.snake(name).toUpperCase();
	return isRawEventName(gatewayName) ? gatewayName : name;
}

export function isGatewayEventName(name: string) {
	return normalizeEventName(name) !== name || isRawEventName(name);
}

export async function resolveRawEventData(name: string, client: UsingClient, raw: unknown) {
	if (!isRawEventName(name)) return raw;
	const rawEvent = RawEvents[name] as (client: UsingClient, raw: unknown) => unknown;
	return rawEvent(client, raw);
}

function isRawEventName(name: string): name is keyof typeof RawEvents {
	return rawEventNames.includes(name);
}
