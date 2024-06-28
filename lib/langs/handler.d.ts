import type { LocaleString } from 'discord-api-types/v10';
import { BaseHandler } from '../common';
import type { FileLoaded } from '../commands/handler';
export declare class LangsHandler extends BaseHandler {
    values: Partial<Record<string, any>>;
    protected filter: (path: string) => boolean;
    defaultLang?: string;
    aliases: [string, LocaleString[]][];
    getLocale(locale: string): string;
    getKey(lang: string, message: string): string | undefined;
    get(userLocale: string): import("./router").__InternalParseLocale<import("..").DefaultLocale> & {
        get(locale?: string): import("..").DefaultLocale;
    };
    load(dir: string, instances?: {
        name: string;
        file: Record<string, any>;
    }[]): Promise<void>;
    onFile(_locale: string, file: FileLoaded<Record<string, any>>): Record<string, any> | false;
}
