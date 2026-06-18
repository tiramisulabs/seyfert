import { describe, expect, test, vi } from 'vitest';
import { Command } from '../src/commands';
import { CommandHandler } from '../src/commands/handler';
import { LangsHandler } from '../src/langs/handler';
import { ApplicationCommandOptionType } from '../src/types';

function createCommandHandler() {
	const warn = vi.fn();
	const logger = { warn, error: vi.fn() };
	const langs = new LangsHandler(logger as never);
	langs.values = {
		'es-ES': {
			commands: {
				localized: {
					name: 'Localizado',
					options: {
						target: {
							name: 'Objetivo',
						},
					},
					choices: {
						public: 'Publico',
					},
					groups: {
						admin: {
							name: 'Admin',
						},
					},
				},
			},
		},
	};
	const client = { langs, options: {} };
	const handler = new CommandHandler(logger as never, client as never);
	return { handler, warn };
}

class LocalizedCommand extends Command {
	name = 'localized';
	description = 'Localized';
	__t = {
		name: 'commands.localized.name',
		description: 'commands.localized.description',
	};
	__tGroups = {
		admin: {
			name: 'commands.localized.groups.admin.name',
			description: 'commands.localized.groups.admin.description',
			defaultDescription: 'Admin commands',
		},
	};
	options = [
		{
			name: 'target',
			description: 'Target',
			type: ApplicationCommandOptionType.String,
			locales: {
				name: 'commands.localized.options.target.name',
				description: 'commands.localized.options.target.description',
			},
			choices: [
				{
					name: 'Public',
					value: 'public',
					locales: 'commands.localized.choices.public',
				},
				{
					name: 'Private',
					value: 'private',
					locales: 'commands.localized.choices.private',
				},
			],
		},
	];
	run() {}
}

describe('CommandHandler locale diagnostics', () => {
	test('warns when translated command surfaces resolve to nothing', () => {
		const { handler, warn } = createCommandHandler();
		const command = new LocalizedCommand();

		expect(() => handler.parseLocales(command)).not.toThrow();

		expect(command.name_localizations?.['es-ES']).toBe('Localizado');
		expect(command.description_localizations?.['es-ES']).toBeUndefined();
		expect(command.options?.[0].name_localizations?.['es-ES']).toBe('Objetivo');
		expect(command.options?.[0].description_localizations?.['es-ES']).toBeUndefined();
		expect(command.options?.[0].choices?.[0].name_localizations?.['es-ES']).toBe('Publico');
		expect(command.options?.[0].choices?.[1].name_localizations?.['es-ES']).toBeUndefined();
		expect(command.groups?.admin.name).toEqual([['es-ES', 'Admin']]);
		expect(command.groups?.admin.description).toEqual([]);

		const warnings = warn.mock.calls.map(call => call.join(' '));
		expect(warnings).toEqual(
			expect.arrayContaining([
				expect.stringContaining(
					'Locale key "commands.localized.description" resolved to nothing for command "localized" description in locale "es-ES".',
				),
				expect.stringContaining(
					'Locale key "commands.localized.options.target.description" resolved to nothing for command "localized" option "target" description in locale "es-ES".',
				),
				expect.stringContaining(
					'Locale key "commands.localized.choices.private" resolved to nothing for command "localized" option "target" choice "Private" in locale "es-ES".',
				),
				expect.stringContaining(
					'Locale key "commands.localized.groups.admin.description" resolved to nothing for command "localized" group "admin" description in locale "es-ES".',
				),
			]),
		);
	});
});
