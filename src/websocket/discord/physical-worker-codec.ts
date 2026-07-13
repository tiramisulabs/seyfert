export function canonicalFingerprint(value: unknown) {
	const seen = new Map<object, number>();
	const encode = (input: unknown): string => {
		if (input === null) return 'null';
		switch (typeof input) {
			case 'undefined':
				return 'undefined';
			case 'boolean':
				return input ? 'true' : 'false';
			case 'string':
				return `string:${JSON.stringify(input)}`;
			case 'bigint':
				return `bigint:${input}`;
			case 'number':
				if (Number.isNaN(input)) return 'number:NaN';
				if (input === Number.POSITIVE_INFINITY) return 'number:+Infinity';
				if (input === Number.NEGATIVE_INFINITY) return 'number:-Infinity';
				if (Object.is(input, -0)) return 'number:-0';
				return `number:${input}`;
			case 'object': {
				const previous = seen.get(input);
				if (previous !== undefined) return `ref:${previous}`;
				const reference = seen.size;
				seen.set(input, reference);
				if (Array.isArray(input)) {
					const entries = Array.from({ length: input.length }, (_, index) =>
						index in input ? `present:${encode(input[index])}` : 'hole',
					);
					return `array:${reference}:${input.length}[${entries.join(',')}]`;
				}
				const prototype = Object.getPrototypeOf(input);
				if (prototype !== Object.prototype && prototype !== null)
					throw new TypeError('Physical payload contains an unsupported structured value');
				return `object:${reference}{${Object.keys(input)
					.sort()
					.map(key => `${JSON.stringify(key)}:${encode((input as Record<string, unknown>)[key])}`)
					.join(',')}}`;
			}
			default:
				throw new TypeError(`Physical payload contains unsupported ${typeof input}`);
		}
	};
	return encode(value);
}

function encodeKeyPart(value: string) {
	return `${value.length}:${value}`;
}

export function identityKey(slot: string, token: string) {
	return `${encodeKeyPart(slot)}${encodeKeyPart(token)}`;
}

export function operationKey(slot: string, token: string, commandId: string) {
	return `${identityKey(slot, token)}${encodeKeyPart(commandId)}`;
}
