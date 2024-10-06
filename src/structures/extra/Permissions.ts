import type { PermissionStrings } from '../../common';
import { PermissionFlagsBits } from '../../types';
import { BitField, type BitFieldResolvable } from './BitField';

export class PermissionsBitField extends BitField<typeof PermissionFlagsBits> {
	Flags = PermissionFlagsBits;
	static All = Object.values(PermissionFlagsBits).reduce((acc, value) => acc | value, 0n);

	constructor(bitfields?: BitFieldResolvable<typeof PermissionFlagsBits>) {
		super();
		if (bitfields) this.bit = this.resolve(bitfields);
	}

	declare keys: (bits?: BitFieldResolvable<typeof PermissionFlagsBits>[]) => PermissionStrings;

	has(...bits: BitFieldResolvable<typeof PermissionFlagsBits>[]) {
		return super.has(...bits) || super.has('Administrator');
	}

	strictHas(...bits: BitFieldResolvable<typeof PermissionFlagsBits>[]) {
		return super.has(...bits);
	}

	resolve<T extends typeof PermissionFlagsBits>(bits: BitFieldResolvable<T>): bigint {
		return PermissionsBitField.resolve(bits);
	}

	static resolve<T extends typeof PermissionFlagsBits>(bits: BitFieldResolvable<T>): bigint {
		switch (typeof bits) {
			case 'string':
				return PermissionsBitField.resolve(PermissionFlagsBits[bits as keyof typeof PermissionFlagsBits]);
			case 'number':
				return BigInt(bits);
			case 'bigint':
				return bits;
			case 'object': {
				if (!Array.isArray(bits)) {
					throw new TypeError(`Cannot resolve permission: ${bits}`);
				}
				return bits.map(x => PermissionsBitField.resolve(x)).reduce((acc, cur) => acc | cur, BitField.None);
			}
			default:
				throw new TypeError(`Cannot resolve permission: ${typeof bits === 'symbol' ? String(bits) : (bits as any)}`);
		}
	}
}
