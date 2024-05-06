import type { Locale, LocaleString } from 'discord-api-types/v10';
import { BaseHandler } from '../common';
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

	async load(dir: string, instances?: { name: string; file: Record<string, any> }[]) {
		const files = instances ?? (await this.loadFilesK<Record<string, any>>(await this.getFiles(dir)));
		for (const i of files) {
			const locale = i.name.split('.').slice(0, -1).join('.');
			const result = this.callback(locale, i.file);
			if (result) this.values[locale] = result;
		}
	}

	setHandlers({ callback }: { callback: LangsHandler['callback'] }) {
		this.callback = callback;
	}

	callback = (_locale: string, file: Record<string, any>): Record<string, any> | false => file;
}
