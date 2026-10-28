import { assert, describe, test } from 'vitest';
import { Formatter } from '../lib/common/it/formatter';
import { FormattingPatterns } from '../lib/types/utils';

describe('Formatter.timestamp', () => {
	const timestampMs = Date.UTC(2024, 0, 2, 3, 4, 5, 678);
	const timestampSeconds = Math.floor(timestampMs / 1000);

	test('formats Date and unix millisecond timestamps with the default relative style', () => {
		const expected = `<t:${timestampSeconds}:R>`;

		assert.equal(Formatter.timestamp(new Date(timestampMs)), expected);
		assert.equal(Formatter.timestamp(timestampMs), expected);
	});
});

describe('Formatter mentions', () => {
	test('formats command and guild navigation mentions the way Discord parses them', () => {
		const command = FormattingPatterns.SlashCommand.exec(Formatter.commandMention('config set', '123456789012345678'));
		assert.equal(command?.groups?.fullName, 'config set');
		assert.equal(command?.groups?.id, '123456789012345678');

		const navigation = FormattingPatterns.GuildNavigation.exec(Formatter.guildNavigation('browse'));
		assert.equal(navigation?.groups?.type, 'browse');
	});
});
