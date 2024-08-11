import { BaseHandler, isCloudfareWorker, magicImport } from '../common';
import { LangRouter } from './router';
import type { FileLoaded } from '../commands/handler';
import type { LocaleString, Locale } from '../types';

export class LangsHandler extends BaseHandler {
	values: Partial<Record<string, any>> = {};
	private __paths: Partial<Record<string, string>> = {};
	protected filter = (path: string) =>
		path.endsWith('.js') || (!path.endsWith('.d.ts') && path.endsWith('.ts')) || path.endsWith('.json');
	defaultLang?: string;
	aliases: [string, LocaleString[]][] = [];

	getLocale(locale: string) {
		return this.aliases.find(([_key, aliases]) => aliases.includes(locale as Locale))?.[0] ?? locale;
	}

	getKey(lang: string, message: string) {
		let value = this.values[lang as string];

		try {
			for (const i of message.split('.')) {
				value = value[i];
			}
		} catch {
			return;
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
			this.parse(i);
		}
	}

	parse(file: EventInstance) {
		const locale = file.name.split('.').slice(0, -1).join('.') || file.name;
		const result = this.onFile(locale, file.file);
		if ('path' in file) this.__paths[locale] = file.path as string;
		if (result) this.values[locale] = result;
	}

	set(instances: EventInstance[]) {
		for (const i of instances) {
			this.parse(i);
		}
	}

	async reload(lang: string) {
		if (isCloudfareWorker()) {
			throw new Error('Reload in cloudfare worker is not supported');
		}
		const value = this.__paths[lang];
		if (!value) return null;
		delete require.cache[value];

		return (this.values[lang] = await magicImport(value).then(x => this.onFile(lang, x)));
	}

	async reloadAll(stopIfFail = true) {
		for (const i in this.__paths) {
			try {
				await this.reload(i);
			} catch (e) {
				if (stopIfFail) throw e;
			}
		}
	}

	onFile(_locale: string, file: FileLoaded<Record<string, any>>): Record<string, any> | false {
		return file.default ?? false;
	}
}

export type EventInstance = { name: string; file: Record<string, any> };
