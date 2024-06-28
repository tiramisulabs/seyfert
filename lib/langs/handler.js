"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LangsHandler = void 0;
const common_1 = require("../common");
const router_1 = require("./router");
class LangsHandler extends common_1.BaseHandler {
    values = {};
    filter = (path) => path.endsWith('.js') || (!path.endsWith('.d.ts') && path.endsWith('.ts')) || path.endsWith('.json');
    defaultLang;
    aliases = [];
    getLocale(locale) {
        return this.aliases.find(([_key, aliases]) => aliases.includes(locale))?.[0] ?? locale;
    }
    getKey(lang, message) {
        let value = this.values[lang];
        try {
            for (const i of message.split('.')) {
                value = value[i];
            }
        }
        catch {
            return;
        }
        if (typeof value !== 'string') {
            return;
        }
        return value;
    }
    get(userLocale) {
        const locale = this.getLocale(userLocale);
        return (0, router_1.LangRouter)(locale, this.defaultLang ?? locale, this.values)();
    }
    async load(dir, instances) {
        const files = instances ?? (await this.loadFilesK(await this.getFiles(dir)));
        for (const i of files) {
            const locale = i.name.split('.').slice(0, -1).join('.') || i.name;
            const result = this.onFile(locale, i.file);
            if (result)
                this.values[locale] = result;
        }
    }
    onFile(_locale, file) {
        return file.default ?? false;
    }
}
exports.LangsHandler = LangsHandler;
