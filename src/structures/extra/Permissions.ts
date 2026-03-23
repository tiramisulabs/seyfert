import { PermissionFlagsBits } from '../../types';
import { BitField, type BitFieldResolvable } from './BitField';

export class PermissionsBitField extends BitField<typeof PermissionFlagsBits> {
	Flags = PermissionFlagsBits;
	static All = Object.values(PermissionFlagsBits).reduce((acc, value) => acc | value, 0n);

	constructor(
		bitfields?: BitFieldResolvable<typeof PermissionFlagsBits> | BitFieldResolvable<typeof PermissionFlagsBits>[],
	) {
		super();
		if (bitfields) this.bit = this.resolve(bitfields);
	}

	declare keys: (bits?: BitFieldResolvable<typeof PermissionFlagsBits>[]) => (keyof typeof PermissionFlagsBits)[];

	has(bits: BitFieldResolvable<typeof PermissionFlagsBits>[]) {
		return super.has(bits) || super.has(['Administrator']);
	}

	strictHas(bits: BitFieldResolvable<typeof PermissionFlagsBits>[]) {
		return super.has(bits);
	}

	static resolve<T extends typeof PermissionFlagsBits>(bits: BitFieldResolvable<T> | BitFieldResolvable<T>[]): bigint {
		return BitField.prototype.resolve(
			bits as BitFieldResolvable<typeof PermissionFlagsBits> | BitFieldResolvable<typeof PermissionFlagsBits>[],
			PermissionFlagsBits,
		);
	}

	toString() {
		return this.bit.toString();
	}

	toString() {
		return this.bit.toString();
	}
}
