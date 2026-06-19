import { describe, expect, test, vi } from 'vitest';
import { CommandContext } from '../src/commands/applications/chatcontext';
import { EntryPointContext } from '../src/commands/applications/entrycontext';
import { MenuCommandContext } from '../src/commands/applications/menucontext';
import { ComponentContext } from '../src/components/componentcontext';
import { ModalContext } from '../src/components/modalcontext';

const interactionContextCases = [
	['CommandContext', CommandContext.prototype],
	['ComponentContext', ComponentContext.prototype],
	['ModalContext', ModalContext.prototype],
	['MenuCommandContext', MenuCommandContext.prototype],
	['EntryPointContext', EntryPointContext.prototype],
] as const;

function createClient(preferGuildLocale: boolean, defaultLang?: string) {
	return {
		langs: {
			defaultLang,
			preferGuildLocale,
		},
		t: vi.fn((locale: string) => locale),
	};
}

function createContext(prototype: object, client: ReturnType<typeof createClient>, interaction?: object) {
	const context = Object.create(prototype);
	context.client = client;
	context.interaction = interaction;
	return context;
}

describe('context lang locale preference', () => {
	test.each(interactionContextCases)('%s preserves locale precedence by default', (_name, prototype) => {
		const client = createClient(false, 'default-lang');
		const context = createContext(prototype, client, {
			guildLocale: 'fr-FR',
			locale: 'es-ES',
		});

		expect(context.t).toBe('es-ES');
		expect(client.t).toHaveBeenCalledWith('es-ES');
	});

	test.each(interactionContextCases)('%s prefers guild locale when enabled', (_name, prototype) => {
		const client = createClient(true, 'default-lang');
		const context = createContext(prototype, client, {
			guildLocale: 'fr-FR',
			locale: 'es-ES',
		});

		expect(context.t).toBe('fr-FR');
		expect(client.t).toHaveBeenCalledWith('fr-FR');
	});

	test.each(interactionContextCases)('%s falls back to locale when guild locale is unavailable', (_name, prototype) => {
		const client = createClient(true, 'default-lang');
		const context = createContext(prototype, client, {
			locale: 'es-ES',
		});

		expect(context.t).toBe('es-ES');
		expect(client.t).toHaveBeenCalledWith('es-ES');
	});

	test('prefix CommandContext uses default language when guild locale preference is enabled', () => {
		const client = createClient(true, 'default-lang');
		const context = createContext(CommandContext.prototype, client);

		expect(context.t).toBe('default-lang');
		expect(client.t).toHaveBeenCalledWith('default-lang');
	});

	test('prefix CommandContext falls back to en-US without a default language', () => {
		const client = createClient(true);
		const context = createContext(CommandContext.prototype, client);

		expect(context.t).toBe('en-US');
		expect(client.t).toHaveBeenCalledWith('en-US');
	});
});
