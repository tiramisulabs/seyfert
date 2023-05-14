export type Tail<A> = A extends [unknown, ...infer rest]
	? rest
	: A extends [unknown]
	? []
	: A extends (infer first)[]
	? first[]
	: never;

export type ValueOf<T> = T[keyof T];

export type ArrayFirsElement<A> = A extends [...infer arr] ? arr[0] : never;

export type RestToKeys<T extends unknown[]> = T extends [infer V, ...infer Keys]
	? { [K in Extract<Keys[number], string>]: V }
	: never;

export type Identify<T> = T extends infer U ? { [K in keyof U]: U[K] } : never;

export type TypeArray<T> = T | T[];

export type When<T extends boolean, A, B = never> = T extends true ? A : B;

export type PickPartial<T, K extends keyof T> = {
	[P in keyof T]?: T[P] | undefined;
} & {
		[P in K]: T[P];
	};

export type MakeRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };

export type CamelCase<S extends string> = S extends `${infer P1}_${infer P2}${infer P3}`
	? `${Lowercase<P1>}${Uppercase<P2>}${CamelCase<P3>}`
	: Lowercase<S>;

export type SnakeCase<S extends string> = S extends `${infer A}${infer Rest}`
	? A extends Uppercase<A>
	? `_${Lowercase<A>}${SnakeCase<Rest>}`
	: `${A}${SnakeCase<Rest>}`
	: Lowercase<S>;

export type ObjectToLower<T> = Identify<{
	[K in keyof T as CamelCase<Exclude<K, symbol | number>>]: T[K] extends object ? Identify<ObjectToLower<T[K]>> : T[K];
}>;

export type ObjectToSnake<T> = Identify<{
	[K in keyof T as SnakeCase<Exclude<K, symbol | number>>]: T[K] extends object ? Identify<ObjectToSnake<T[K]>> : T[K];
}>;
