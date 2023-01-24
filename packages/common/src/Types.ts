export type Tail<A> = A extends [unknown, ...infer rest]
	? rest
	: A extends [unknown]
	? []
	: A extends (infer first)[]
	? first[]
	: never;

export type Identify<T> = T extends infer U ? { [K in keyof U]: U[K] } : never;

export type When<C, T, F = null> = C extends boolean
	? C extends true
		? T
		: F
	: never;

export type PickPartial<T, K extends keyof T> = {
	[P in keyof T]?: T[P] | undefined;
} & { [P in K]: T[P] };

export type CamelCase<S extends string> =
	S extends `${infer P1}_${infer P2}${infer P3}`
		? `${Lowercase<P1>}${Uppercase<P2>}${CamelCase<P3>}`
		: Lowercase<S>;

export type SnakeCase<S extends string> = S extends `${infer A}${infer Rest}`
	? A extends Uppercase<A>
		? `_${Lowercase<A>}${SnakeCase<Rest>}`
		: `${A}${SnakeCase<Rest>}`
	: Lowercase<S>;

export type ObjectToLower<T> = Identify<{
	[K in keyof T as CamelCase<
		Exclude<K, symbol | number>
	>]: T[K] extends object ? Identify<ObjectToLower<T[K]>> : T[K];
}>;

export type ObjectToSnake<T> = Identify<{
	[K in keyof T as SnakeCase<
		Exclude<K, symbol | number>
	>]: T[K] extends object ? Identify<ObjectToSnake<T[K]>> : T[K];
}>;
