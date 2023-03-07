// rome-ignore lint/nursery/noBannedTypes: js trick
export function applyToClass<T extends {}, U extends {}>(structToApply: T, struct: U, ignore?: (keyof T)[]) {
	// @ts-expect-error
	const props = Object.getOwnPropertyNames(structToApply.prototype);
	for (const prop of props) {
		if (ignore?.includes(prop as keyof T) || prop === "constructor") continue;
		// @ts-expect-error
		Object.defineProperty(struct.prototype, prop, Object.getOwnPropertyDescriptor(structToApply.prototype, prop)!);
	}
	return struct as unknown as Struct<T, U>;
}

// rome-ignore lint/nursery/noBannedTypes: fix applyToClass typing
export type Struct<ToMix = {}, Final = {}> = Final extends new (
	..._args: never[]
) => infer F
	? ToMix extends new (
			..._args: never[]
	  ) => infer TM
		? new (
				..._args: ConstructorParameters<Final>
		  ) => F & TM
		: never
	: never;
