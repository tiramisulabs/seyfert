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
