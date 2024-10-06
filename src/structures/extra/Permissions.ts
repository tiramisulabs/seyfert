import type { PermissionStrings } from '../../common';
import { PermissionFlagsBits } from '../../types';
import { BitField, type BitFieldResolvable } from './BitField';

export class PermissionsBitField extends BitField<typeof PermissionFlagsBits> {
	Flags = PermissionFlagsBits;
	static All = Object.values(PermissionFlagsBits).reduce((acc, value) => acc | value, 0n);

	constructor(bitfields?: BitFieldResolvable<typeof PermissionFlagsBits>) {
		super();
		if (bitfields) this.bit = PermissionsBitField.resolve(bitfields);
	}

	declare keys: (bits?: BitFieldResolvable<typeof PermissionFlagsBits>[]) => PermissionStrings;

	has(...bits: BitFieldResolvable<typeof PermissionFlagsBits>[]) {
		return super.has(...bits) || super.has('Administrator');
	}

	strictHas(...bits: BitFieldResolvable<typeof PermissionFlagsBits>[]) {
		return super.has(...bits);
	}

	static resolve<T extends object = typeof PermissionFlagsBits>(bits: BitFieldResolvable<T>): bigint {
		switch (typeof bits) {
			case 'string':
				return PermissionsBitField.resolve(PermissionFlagsBits[bits as keyof typeof PermissionFlagsBits]);
			default:
				return BitField.resolve(bits);
		}
	}
}
