import type { PermissionStrings } from '../../common';
import { PermissionFlagsBits } from '../../types';
import { BitField, type BitFieldResolvable } from './BitField';

export class PermissionsBitField extends BitField<typeof PermissionFlagsBits> {
	Flags = PermissionFlagsBits;
	static All = Object.values(PermissionFlagsBits).reduce((acc, value) => acc | value, 0n);

	declare keys: (bits?: BitFieldResolvable<typeof PermissionFlagsBits>[]) => PermissionStrings;

	has(...bits: BitFieldResolvable<typeof PermissionFlagsBits>[]) {
		return super.has(...bits) || super.has('Administrator');
	}

	strictHas(...bits: BitFieldResolvable<typeof PermissionFlagsBits>[]) {
		return super.has(...bits);
	}
}
