type ComponentCustomId = string | RegExp;

export function matchesCustomId(customId: ComponentCustomId, value: string) {
	if (typeof customId === 'string') return customId === value;
	if (!customId.global && !customId.sticky) return customId.test(value);
	// String#search ignores and restores lastIndex for standard stateful regular expressions.
	return value.search(customId) !== -1;
}
