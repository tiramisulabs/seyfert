import { assert, describe, test } from 'vitest';
import { BitField } from '../lib/structures/extra/BitField';
import { PermissionsBitField } from '../lib/structures/extra/Permissions';
import { PermissionFlagsBits } from '../lib/types';

describe('PermissionsBitField', () => {
	test('constructor', () => {
		const p = new PermissionsBitField(['CreateEvents']);
		assert.equal(p.bits, PermissionFlagsBits.CreateEvents);
	});

	test('add', () => {
		const p = new PermissionsBitField(['CreateEvents']);
		p.add(['AttachFiles']);
		p.add('ChangeNickname');
		assert.equal(
			p.bits,
			PermissionFlagsBits.CreateEvents | PermissionFlagsBits.AttachFiles | PermissionFlagsBits.ChangeNickname,
		);
	});

	test('remove', () => {
		const p = new PermissionsBitField(['CreateEvents']);
		p.remove('CreateEvents');
		assert.equal(p.bits, BitField.None);
	});

	test('keys', () => {
		const p = new PermissionsBitField(['CreateEvents', 'Administrator']);
		p.add(['AttachFiles']);
		p.add('ChangeNickname');

		const keys = ['CreateEvents', 'Administrator', 'AttachFiles', 'ChangeNickname'];
		assert.equal(
			true,
			p.keys().every(x => keys.includes(x)),
		);
		assert.equal(p.keys().length, 4);
	});

	test('values', () => {
		const p = new PermissionsBitField(['CreateEvents']);
		p.add('Administrator');
		p.add(['ChangeNickname']);
		assert.deepEqual(p.values(), [
			PermissionFlagsBits.Administrator,
			PermissionFlagsBits.ChangeNickname,
			PermissionFlagsBits.CreateEvents,
		]);
	});

	test('missings', () => {
		const p = new PermissionsBitField(['CreateEvents']);
		p.add('Administrator');
		p.add(['ChangeNickname']);
		assert.deepEqual(p.missings('Connect'), [PermissionFlagsBits.Connect]);
	});

	test('equals', () => {
		const p = new PermissionsBitField(['CreateEvents']);
		p.add(['ChangeNickname']);
		assert.deepEqual(p.equals(['ChangeNickname', 'CreateEvents']), true);
		assert.deepEqual(p.equals('Connect'), false);
	});
});
