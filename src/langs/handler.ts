import { basename } from 'node:path';
import type { FileLoaded } from '../commands/handler';
import { BaseHandler, isCloudfareWorker, magicImport, SeyfertError } from '../common';
import type { Locale, LocaleString } from '../types';
import { LangRouter } from './router';

export class LangsHandler extends BaseHandler {
	values: Partial<Record<string, any>> = {};
	private __paths: Partial<Record<string, string>> = {};
	filter = (path: string) =>
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

	parse(file: LangInstance) {
		const oldLocale = file.name.split('.').slice(0, -1).join('.') || file.name;
		const result = this.onFile(oldLocale, file);
		if (!result) return;
		if ('path' in file) this.__paths[result.locale] = file.path as string;
		this.values[result.locale] = result.file;
	}

	set(instances: LangInstance[]) {
		for (const i of instances) {
			this.parse(i);
		}
	}

	async reload(lang: string) {
		if (isCloudfareWorker()) {
			throw new SeyfertError('Reload in cloudfare worker is not supported');
		}
		const path = this.__paths[lang];
		if (!path) return null;
		delete require.cache[path];
		const value = await magicImport(path).then(x =>
			this.onFile(lang, {
				file: x,
				name: basename(path),
				path,
			} satisfies LangInstance),
		);
		if (!value) return null;
		return (this.values[lang] = value.file);
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

	onFile(locale: string, { file }: LangInstance): { file: Record<string, any>; locale: string } | false {
		return file.default
			? {
					file: file.default,
					locale,
				}
			: false;
	}
}

export type LangInstance = { name: string; file: FileLoaded<Record<string, any>>; path: string };
