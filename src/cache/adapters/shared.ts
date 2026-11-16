import { createValidationMetadata, SeyfertError } from '../../common/it/error';
import type { AdapterIncrementOptions } from './types';

export type CacheResourceLayout = 'root' | 'guild-indexed' | 'guild-keyed' | 'message' | 'custom';

const resourceLayouts = new Map<string, Exclude<CacheResourceLayout, 'custom'>>([
	['guild', 'root'],
	['user', 'root'],
	['channel', 'guild-indexed'],
	['emoji', 'guild-indexed'],
	['presence', 'guild-keyed'],
	['role', 'guild-indexed'],
	['stage_instance', 'guild-indexed'],
	['sticker', 'guild-indexed'],
	['overwrite', 'guild-indexed'],
	['ban', 'guild-keyed'],
	['member', 'guild-keyed'],
	['voice_state', 'guild-keyed'],
	['message', 'message'],
]);

export function getCacheResourceLayout(resource: string): CacheResourceLayout {
	return resourceLayouts.get(resource) ?? 'custom';
}

export function needsCacheStorageIndex(key: string, namespace: string) {
	return !key.startsWith(namespace) || key.charCodeAt(namespace.length) !== 46;
}

/** @internal Validates and prepares a copy before either memory adapter changes storage or expiration. */
export function prepareIncrement(data: unknown, field: string, delta: number, options?: AdapterIncrementOptions) {
	if (!Number.isFinite(delta)) {
		throw new SeyfertError('BAD_OPTION', {
			metadata: createValidationMetadata('finite increment delta', delta),
		});
	}
	if (options?.min !== undefined && !Number.isFinite(options.min)) {
		throw new SeyfertError('BAD_OPTION', {
			metadata: createValidationMetadata('finite increment minimum', options.min),
		});
	}
	if (typeof data !== 'object' || data === null || Array.isArray(data) || !Object.hasOwn(data, field)) return;
	const previous = (data as Record<string, unknown>)[field];
	if (typeof previous !== 'number' || !Number.isFinite(previous)) return;
	const value = Math.max(options?.min ?? Number.NEGATIVE_INFINITY, previous + delta);
	if (!Number.isFinite(value)) {
		throw new SeyfertError('BAD_OPTION', {
			metadata: createValidationMetadata('finite increment result', value),
		});
	}
	return { value, data: { ...data, [field]: value } };
}
