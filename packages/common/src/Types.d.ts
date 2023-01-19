export declare type Tail<A> = A extends [unknown, ...infer rest] ? rest : A extends [unknown] ? [] : A extends (infer first)[] ? first[] : never;
export declare type Identify<T> = T extends infer U ? {
    [K in keyof U]: U[K];
} : never;
export declare type When<C, T, F = null> = C extends boolean ? C extends true ? T : F : never;
export declare type PickPartial<T, K extends keyof T> = {
    [P in keyof T]?: T[P] | undefined;
} & {
    [P in K]: T[P];
};
