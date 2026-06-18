import { basename } from 'node:path';
import type { FileLoaded } from '../commands/handler';
import { type Awaitable, BaseHandler, isCloudfareWorker, isObject, magicImport, SeyfertError } from '../common';
import type { Locale, LocaleString } from '../types';
import { LangRouter } from './router';

type LangFileResult = { file: Record<string, any>; locale: string } | false;

function isPromiseLike<T>(value: Awaitable<T>): value is Promise<T> {
	return !!value && typeof (value as Promise<T>).then === 'function';
}

export class LangsHandler extends BaseHandler {
	values: Partial<Record<string, any>> = {};
	private __paths: Partial<Record<string, string>> = {};
	filter = (path: string) =>
		path.endsWith('.js') || (!path.endsWith('.d.ts') && path.endsWith('.ts')) || path.endsWith('.json');
	defaultLang?: string;
	preferGuildLocale = false;
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
			await this.parse(i);
		}
	}

	parse(file: LangInstance): void | Promise<void> {
		const oldLocale = file.name.split('.').slice(0, -1).join('.') || file.name;
		const result = this.onFile(oldLocale, file);
		if (isPromiseLike(result)) return result.then(value => this.applyParsedFile(file, value));
		this.applyParsedFile(file, result);
		return;
	}

	private applyParsedFile(file: LangInstance, result: LangFileResult) {
		if (!result) return;
		if (file.path) this.__paths[result.locale] = file.path;
		this.values[result.locale] = result.file;
	}

	set(instances: LangInstance[]) {
		for (const i of instances) {
			this.parse(i);
		}
	}

	async reload(lang: string) {
		if (isCloudfareWorker()) {
			throw new SeyfertError('RELOAD_NOT_SUPPORTED', {
				metadata: { detail: 'Reload in Cloudflare worker is not supported' },
			});
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

	onFile(locale: string, { file, name, path }: LangInstance): Awaitable<LangFileResult> {
		const modulePath = path ?? name;
		if (isObject(file.default)) {
			return {
				file: file.default,
				locale,
			};
		}

		if (!isObject(file)) {
			this.logger.warn(`Lang file "${modulePath}" skipped: invalid module value.`, `exports: ${typeof file}`);
			return false;
		}

		const module = file as Record<PropertyKey, unknown>;
		const isModuleNamespace = module[Symbol.toStringTag] === 'Module' || 'default' in file || '__esModule' in file;
		if (!isModuleNamespace) {
			return { file, locale };
		}

		const exportNames = Object.keys(file).filter(key => key !== 'default' && key !== '__esModule');
		const objectExportNames = exportNames.filter(key => isObject(file[key]));
		if (objectExportNames.length === 1 && !('default' in file)) {
			const exportName = objectExportNames[0];
			this.logger.warn(
				`Lang file "${modulePath}" has no default export; using named object export "${exportName}".`,
				`exports: ${exportNames.join(', ') || '(none)'}`,
			);
			return {
				file: file[exportName] as Record<string, any>,
				locale,
			};
		}

		const invalidDefault = 'default' in file ? 'default' : undefined;
		const invalidExports = [invalidDefault, ...exportNames].filter((key): key is string => !!key);
		this.logger.warn(
			`Lang file "${modulePath}" skipped: ${
				objectExportNames.length > 1 ? 'ambiguous named object exports' : 'no valid default export'
			}.`,
			`exports: ${invalidExports.join(', ') || '(none)'}`,
		);
		return false;
	}
}

export type LangInstance = { name: string; file: FileLoaded<Record<string, any>>; path?: string };
