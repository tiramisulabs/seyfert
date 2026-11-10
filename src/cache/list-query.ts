type ListQuery = { limit?: number; before?: string; after?: string };

export function hasCacheQuery<T extends object>(query: T | undefined): query is T {
	return query !== undefined && Object.values(query).some(value => value !== undefined);
}

export function compareSnowflakes(left: string, right: string): number {
	return left.length - right.length || (left < right ? -1 : left > right ? 1 : 0);
}

/**
 * The cache only pages by `limit`, `before` and `after`. Anything else, an ambiguous cursor pair, or a limit Discord
 * would reject is left for Discord to answer. Checked before reading ids so a rejected query costs no adapter call.
 */
export function canPageInCache(query: ListQuery, maxLimit: number): boolean {
	if (query.before !== undefined && query.after !== undefined) return false;
	if (query.limit !== undefined && (!Number.isInteger(query.limit) || query.limit < 1 || query.limit > maxLimit))
		return false;
	for (const key in query) {
		if (key !== 'limit' && key !== 'before' && key !== 'after' && query[key as keyof ListQuery] !== undefined)
			return false;
	}
	return true;
}

/**
 * Returns the ascending page Discord would return for the cursor: the lowest ids after `after`, or the highest ids
 * before `before`. Keeps the worst candidate at the heap root so only the selected page is ever sorted.
 */
export function selectCachePage(ids: string[], query: ListQuery, limit: number): string[] {
	const heap: string[] = [];
	const direction = query.before === undefined ? 1 : -1;
	const compare = (left: string, right: string) => direction * compareSnowflakes(left, right);
	for (const id of ids) {
		if (query.after !== undefined && compareSnowflakes(id, query.after) <= 0) continue;
		if (query.before !== undefined && compareSnowflakes(id, query.before) >= 0) continue;
		if (heap.length < limit) {
			let index = heap.length;
			heap.push(id);
			while (index > 0) {
				const parent = (index - 1) >>> 1;
				if (compare(heap[parent], id) >= 0) break;
				heap[index] = heap[parent];
				index = parent;
			}
			heap[index] = id;
		} else if (compare(id, heap[0]) < 0) {
			let index = 0;
			while (index * 2 + 1 < heap.length) {
				let child = index * 2 + 1;
				if (child + 1 < heap.length && compare(heap[child + 1], heap[child]) > 0) child++;
				if (compare(id, heap[child]) >= 0) break;
				heap[index] = heap[child];
				index = child;
			}
			heap[index] = id;
		}
	}
	return heap.sort(compareSnowflakes);
}
