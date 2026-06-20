export type FakePromiseResult<T> = {
	then<R>(callback: (arg: Awaited<T>) => R): R;
};

export function fakePromise<T = unknown | Promise<unknown>>(value: T): FakePromiseResult<T> {
	if (value instanceof Promise) return value as any;
	return {
		then: callback => callback(value as Awaited<T>),
	};
}
