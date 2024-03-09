import { BaseHandler, type Locale, type LocaleString } from '../common';
import { LangRouter } from './router';

export class LangsHandler extends BaseHandler {
	values: Partial<Record<string, any>> = {};
	protected filter = (path: string) =>
		path.endsWith('.js') || (!path.endsWith('.d.ts') && path.endsWith('.ts')) || path.endsWith('.json');
	defaultLang?: string;
	aliases: [string, LocaleString[]][] = [];

	getLocale(locale: string) {
		return this.aliases.find(([_key, aliases]) => aliases.includes(locale as Locale))?.[0] ?? locale;
	}

	getKey(lang: string, message: string) {
		let value = this.values[lang as string];

		for (const i of message.split('.')) {
			value = value[i];
		}

		if (typeof value !== 'string') {
			return;
		}

		return value;
	}

	get(userLocale: string) {
		const locale = this.getLocale(userLocale);
		return LangRouter(locale, this.defaultLang ?? locale, this.values)();
	}

	async load(dir: string) {
		const files = await this.loadFilesK<Record<string, any>>(await this.getFiles(dir));
		for (const i of files) {
			const locale = i.name.split('.').slice(0, -1).join('.');
			this.values[locale] = i.file;
		}
	}
}
