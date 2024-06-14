import type { GatewayIntentBits, PermissionFlagsBits } from 'discord-api-types/v10';

export type ToClass<T, This> = new (
	...args: any[]
) => {
	[K in keyof T]: T[K] extends (...args: any[]) => any
		? ReturnType<T[K]> extends Promise<T>
			? (...args: Parameters<T[K]>) => Promise<This>
			: ReturnType<T[K]> extends T
				? (...args: Parameters<T[K]>) => This
				: T[K]
		: T[K];
};

export type StringToNumber<T extends string> = T extends `${infer N extends number}` ? N : never;

export type MakePartial<T, K extends keyof T> = Omit<T, K> & { [P in K]?: T[P] };

export type DeepPartial<T> = {
	[K in keyof T]?: T[K] extends Record<any, any>
		? DeepPartial<T[K]>
		: T[K] extends (infer I)[]
			? DeepPartial<I>[]
			: T[K];
};

export type OmitInsert<T, K extends keyof T, I> = I extends [] ? Omit<T, K> & I[number] : Omit<T, K> & I;

export type IntentStrings = (keyof typeof GatewayIntentBits)[];

export type PermissionStrings = (keyof typeof PermissionFlagsBits)[];

export type RestOrArray<T> = T[] | [T[]];

export interface StructWhen<Prop = any, State extends keyof StructWhen = 'cached'> {
	cached: Prop | undefined;
	api: State extends 'api' ? Prop : undefined;
	create: State extends 'create' ? Prop : undefined;
}

export type StructStates = keyof StructWhen;

export type StructPropState<Prop, State extends StructStates, Select extends StructStates> = StructWhen<
	Prop,
	Select
>[State];

export type WithID<More> = { id: string } & More;

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

export type AuxIsStrictlyUndefined<T> = T extends undefined | null | never | void ? true : false;

export type IsStrictlyUndefined<T> = AuxIsStrictlyUndefined<T> extends true
	? true
	: AuxIsStrictlyUndefined<T> extends false
		? false
		: false;

export type If<T extends boolean, A, B = null> = T extends true ? A : B extends null ? A | null : B;

export type NulleableCoalising<A, B> = NonFalsy<A> extends never ? B : A;

export type TupleOr<A, T> = ValueOf<A> extends never ? A : TupleOr<ArrayFirsElement<T>, Tail<T>>;

export type PickPartial<T, K extends keyof T> = {
	[P in keyof T]?: T[P] | undefined;
} & {
	[P in K]: T[P];
};

export type MakeRequired<T, K extends keyof T = keyof T> = T & { [P in K]-?: NonFalsy<T[P]> };

export type NonFalsy<T> = T extends false | 0 | '' | null | undefined | 0n ? never : T;

export type CamelCase<S extends string> = S extends `${infer P1}_${infer P2}${infer P3}`
	? `${Lowercase<P1>}${Uppercase<P2>}${CamelCase<P3>}`
	: Lowercase<S>;

export type SnakeCase<S extends string> = S extends `${infer A}${infer Rest}`
	? A extends Uppercase<A>
		? `_${Lowercase<A>}${SnakeCase<Rest>}`
		: `${A}${SnakeCase<Rest>}`
	: Lowercase<S>;

export type ObjectToLower<T> = Identify<{
	[K in keyof T as CamelCase<Exclude<K, symbol | number>>]: T[K] extends unknown[]
		? Identify<ObjectToLower<T[K][0]>[]>
		: T[K] extends object
			? Identify<ObjectToLower<T[K]>>
			: AuxIsStrictlyUndefined<T[K]> extends true
				? undefined
				: ObjectToLowerUndefined<T[K]>;
}>;

export type ObjectToLowerUndefined<T> = T extends unknown[]
	? ObjectToLower<T[0]>[]
	: Identify<{
			[K in keyof T as CamelCase<Exclude<K, symbol | number>>]: T[K] extends unknown[]
				? ObjectToLower<T[K][0]>[]
				: T[K] extends object
					? ObjectToLower<T[K]>
					: T[K];
		}>;

export type ObjectToSnake<T> = Identify<{
	[K in keyof T as SnakeCase<Exclude<K, symbol | number>>]: T[K] extends unknown[]
		? Identify<ObjectToSnake<T[K][0]>[]>
		: T[K] extends object
			? Identify<ObjectToSnake<T[K]>>
			: AuxIsStrictlyUndefined<T[K]> extends true
				? undefined
				: ObjectToSnakeUndefined<T[K]>;
}>;

export type ObjectToSnakeUndefined<T> = T extends unknown[]
	? ObjectToSnake<T[0]>[]
	: Identify<{
			[K in keyof T as SnakeCase<Exclude<K, symbol | number>>]: T[K] extends unknown[]
				? ObjectToSnake<T[K][0]>[]
				: T[K] extends object
					? ObjectToSnake<T[K]>
					: T[K];
		}>;

export type UnionToTuple<U, A extends any[] = []> = (U extends void ? void : (arg: () => U) => never) extends (
	arg: infer I,
) => void
	? I extends () => infer W
		? UnionToTuple<Exclude<U, W>, [W, ...A]>
		: A
	: never;

export type KeysWithUndefined<T> = {
	[K in keyof T]-?: undefined extends T[K] ? K : null extends T[K] ? K : never;
}[keyof T];

type OptionalizeAux<T extends object> = Identify<
	{
		[K in KeysWithUndefined<T>]?: T[K] extends ObjectLiteral ? Optionalize<T[K]> : T[K];
	} & {
		[K in Exclude<keyof T, KeysWithUndefined<T>>]: T[K] extends ObjectLiteral ? Optionalize<T[K]> : T[K];
	}
>;

/**
 * Makes all of properties in T optional when they're null | undefined
 * it is recursive
 */
export type Optionalize<T> = T extends object
	? // biome-ignore lint/style/useShorthandArrayType: typescript things
		// biome-ignore lint/style/useConsistentArrayType: <explanation>
		T extends Array<unknown>
		? number extends T['length']
			? T[number] extends object
				? // biome-ignore lint/style/useShorthandArrayType: <explanation>
					// biome-ignore lint/style/useConsistentArrayType: <explanation>
					Array<OptionalizeAux<T[number]>>
				: T
			: Partial<T>
		: OptionalizeAux<T>
	: T;

export type ObjectLiteral<T = unknown> = {
	[K in PropertyKey]: T;
};

export type DropT<T, R> = {
	[P in keyof T as T[P] extends R ? never : P]: T[P] extends R ? never : T[P];
};

export type DropTI<T, U> = {
	[P in keyof T as U extends T[P] ? never : P]: U extends T[P] ? never : T[P];
};

export type KeepT<T, R> = {
	[P in keyof T as T[P] extends R ? P : never]: T[P] extends R ? T[P] : never;
};

export type KeepTI<T, U> = {
	[P in keyof T as U extends T[P] ? P : never]: U extends T[P] ? T[P] : never;
};

export type Clean<T> = DropT<T, never>;

export type PartialAvoid<U, T> = Identify<KeepT<T, U> & Partial<T>>;

// eslint-disable-next-line @typescript-eslint/ban-types
export type PartialClass<T> = PartialAvoid<Function, T>;

export type AtLeastOne<
	T,
	U = {
		[K in keyof T]: Pick<T, K>;
	},
> = Partial<T> & U[keyof U];

export type FlatObjectKeys<T extends Record<string, any>, Key = keyof T> = Key extends string
	? T[Key] extends Record<string, unknown>
		? `${Key}.${FlatObjectKeys<T[Key]>}`
		: T[Key] extends string
			? `${Key}`
			: never
	: never;

export type Awaitable<V> = Promise<V> | V;
