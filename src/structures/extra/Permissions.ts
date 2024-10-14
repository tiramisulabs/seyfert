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

	resolve<T extends typeof PermissionFlagsBits>(...bits: BitFieldResolvable<T>[]): bigint {
		return bits.reduce<bigint>((acc, cur) => acc | PermissionsBitField.resolve(cur), BitField.None);
	}

	static resolve<T extends typeof PermissionFlagsBits>(...bits: BitFieldResolvable<T>[]): bigint {
		let bitsResult = 0n;

		for (const bit of bits) {
			switch (typeof bit) {
				case 'string':
					bitsResult |= PermissionsBitField.resolve(PermissionFlagsBits[bit as keyof typeof PermissionFlagsBits]);
					break;
				case 'number':
					bitsResult |= BigInt(bit);
					break;
				case 'bigint':
					bitsResult |= bit;
					break;
				case 'object': {
					if (!Array.isArray(bit)) {
						throw new TypeError(`Cannot resolve permission: ${bit}`);
					}
					bitsResult |= bit.reduce<bigint>((acc, val) => PermissionsBitField.resolve(val) | acc, BitField.None);
					break;
				}
				default:
					throw new TypeError(`Cannot resolve permission: ${typeof bit === 'symbol' ? String(bit) : (bit as any)}`);
			}
		}

		return bitsResult;
	}
}
