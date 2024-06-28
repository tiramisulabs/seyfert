"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LangRouter = void 0;
const LangRouter = (userLocale, defaultLang, langs) => {
    function createProxy(route = [], args = []) {
        const noop = () => {
            return;
        };
        return new Proxy(noop, {
            get: (_, key) => {
                if (key === 'get') {
                    function getValue(locale) {
                        if (typeof locale === 'undefined')
                            throw new Error('Undefined locale');
                        let value = langs[locale];
                        for (const i of route)
                            value = value[i];
                        return value;
                    }
                    return (locale) => {
                        let result;
                        try {
                            result = getValue(locale ?? userLocale);
                        }
                        catch {
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
        });
    }
    return createProxy;
};
exports.LangRouter = LangRouter;
/**Idea inspiration from: FreeAoi */
