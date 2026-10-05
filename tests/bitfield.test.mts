import { assert, describe, expect, test } from 'vitest';
import { PermissionsBitField } from '../src/structures/extra/Permissions';

describe('PermissionsBitField', () => {
	test('resolve throws on invalid string', () => {
		const p = new PermissionsBitField();
		expect(() => p.resolve('not_a_flag' as any)).toThrow(TypeError);
	});

	test('resolve throws on NaN', () => {
		const p = new PermissionsBitField();
		expect(() => p.resolve(NaN as any)).toThrow(TypeError);
	});

	test('resolve throws on Infinity', () => {
		const p = new PermissionsBitField();
		expect(() => p.resolve(Infinity as any)).toThrow(TypeError);
	});

	test('resolve throws on float number', () => {
		const p = new PermissionsBitField();
		expect(() => p.resolve(1.5 as any)).toThrow(TypeError);
	});

	test('resolve throws on empty string', () => {
		const p = new PermissionsBitField();
		expect(() => p.resolve('' as any)).toThrow(TypeError);
	});

	test('has accepts scalar and array permissions', () => {
		const p = new PermissionsBitField(['CreateEvents', 'SendMessages']);

		assert.equal(p.has('CreateEvents'), true);
		assert.equal(p.has('Connect'), false);
		assert.equal(p.has(['CreateEvents', 'SendMessages']), true);
		assert.equal(p.has(['CreateEvents', 'Connect']), false);
	});

	test('strictHas accepts scalar and array permissions', () => {
		const p = new PermissionsBitField(['CreateEvents', 'SendMessages']);

		assert.equal(p.strictHas('CreateEvents'), true);
		assert.equal(p.strictHas('Connect'), false);
		assert.equal(p.strictHas(['CreateEvents', 'SendMessages']), true);
		assert.equal(p.strictHas(['CreateEvents', 'Connect']), false);
	});
});
