import type { DefaultLocale } from '../commands';

export const LangRouter = (userLocale: string, defaultLang: string, langs: Partial<Record<string, any>>) => {
	function createProxy(
		route = [] as string[],
		args: any[] = [],
	): __InternalParseLocale<DefaultLocale> & { get(locale?: string): DefaultLocale } {
		const noop = () => {
			return;
		};
		return new Proxy(noop, {
			get: (_, key: string) => {
				if (key === 'get') {
					function getValue(locale?: string) {
						if (typeof locale === 'undefined') throw new Error('Undefined locale');
						let value = langs[locale] as Record<string, any>;
						for (const i of route) value = value[i];
						return value;
					}
					return (locale?: string) => {
						let result;
						try {
							result = getValue(locale ?? userLocale);
						} catch {
							result = getValue(defaultLang);
						}
						const value = typeof result === 'function' ? result(...args) : result;
						return value;
					};
				}
				return createProxy([...route, key], args);
			},
			apply: (...[, , args]) => {
				return createProxy(route, args);
			},
		}) as any;
	}
	return createProxy;
};

export type __InternalParseLocale<T extends Record<string, any>> = {
	[K in keyof T]: T[K] extends (...args: any[]) => any
		? (...args: Parameters<T[K]>) => { get(locale?: string): ReturnType<T[K]> }
		: T[K] extends string
			? { get(locale?: string): T[K] }
			: T[K] extends unknown[]
				? { get(locale?: string): T[K] }
				: T[K] extends Record<string, any>
					? __InternalParseLocale<T[K]> & { get(locale?: string): T[K] }
					: never;
};

export type ParseLocales<T extends Record<string, any>> = T;
/**Idea inspiration from: FreeAoi */
