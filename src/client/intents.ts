import type { IntentStrings } from '../common/types/util';
import { GatewayIntentBits } from '../types';

export type GatewayIntentInput = number | IntentStrings | number[];

export function resolveGatewayIntents(intents?: GatewayIntentInput): number {
	if (typeof intents === 'number') return intents;
	return (
		intents?.reduce<number>(
			(current, intent) => current | (typeof intent === 'number' ? intent : GatewayIntentBits[intent]),
			0,
		) ?? 0
	);
}
