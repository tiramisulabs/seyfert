import type { DefaultLocale } from '../commands';
export declare const LangRouter: (userLocale: string, defaultLang: string, langs: Partial<Record<string, any>>) => (route?: string[], args?: any[]) => __InternalParseLocale<DefaultLocale> & {
    get(locale?: string): DefaultLocale;
};
export type __InternalParseLocale<T extends Record<string, any>> = {
    [K in keyof T]: T[K] extends (...args: any[]) => any ? (...args: Parameters<T[K]>) => {
        get(locale?: string): ReturnType<T[K]>;
    } : T[K] extends string ? {
        get(locale?: string): T[K];
    } : T[K] extends unknown[] ? {
        get(locale?: string): T[K];
    } : T[K] extends Record<string, any> ? __InternalParseLocale<T[K]> & {
        get(locale?: string): T[K];
    } : never;
};
export type ParseLocales<T extends Record<string, any>> = T;
/**Idea inspiration from: FreeAoi */
