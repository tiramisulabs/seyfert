export type BitFieldResolvable<T extends object> = keyof T | number | bigint | (keyof T | number | bigint)[];

export class BitField<T extends object> {
	static None = 0n;
	Flags: Record<string, bigint> = {};

	protected bit: bigint = BitField.None;

	constructor(bitfields?: BitFieldResolvable<T>) {
		if (bitfields) this.bit = this.resolve(bitfields);
	}

	set bits(bits: BitFieldResolvable<T>) {
		this.bit = this.resolve(bits);
	}

	get bits(): bigint {
		return this.bit;
	}

	has(...bits: BitFieldResolvable<T>[]) {
		const bitsResolved = bits.map(bit => this.resolve(bit));
		return bitsResolved.every(bit => (this.bits & bit) === bit);
	}

	missings(...bits: BitFieldResolvable<T>[]) {
		const bitsResolved = bits.map(bit => this.resolve(bit));
		return bitsResolved.filter(bit => (this.bits & bit) !== bit);
	}

	equals(other: BitFieldResolvable<T>) {
		return this.bits === this.resolve(other);
	}

	keys(bits: BitFieldResolvable<T>[] = [this.bits]) {
		const bitsResolved = bits.map(bit => this.resolve(bit));
		return Object.entries(this.Flags).reduce((acc, value) => {
			if (bitsResolved.some(bit => (bit & value[1]) === value[1])) {
				acc.push(value[0]);
				return acc;
			}
			return acc;
		}, [] as string[]);
	}

	values(bits: BitFieldResolvable<T>[] = [this.bits]) {
		const bitsResolved = bits.map(bit => this.resolve(bit));
		return Object.entries(this.Flags).reduce((acc, value) => {
			if (bitsResolved.some(bit => (bit & value[1]) === value[1])) {
				acc.push(value[1]);
				return acc;
			}
			return acc;
		}, [] as bigint[]);
	}

	add(...bits: (BitFieldResolvable<T> | undefined)[]) {
		for (const bit of bits) {
			if (!bit) continue;
			this.bits |= this.resolve(bit);
		}
		return this.bits;
	}

	remove(...bits: BitFieldResolvable<T>[]): bigint {
		for (const bit of bits) {
			this.bits &= ~this.resolve(bit);
		}
		return this.bits;
	}

	resolve(...bits: BitFieldResolvable<T>[]): bigint {
		let bitsResult = 0n;

		for (const bit of bits) {
			switch (typeof bit) {
				case 'string':
					bitsResult |= this.resolve(this.Flags[bit]);
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
					bitsResult |= bits.reduce<bigint>((acc, val) => this.resolve(val) | acc, BitField.None);
					break;
				}
				default:
					throw new TypeError(`Cannot resolve permission: ${typeof bit === 'symbol' ? String(bit) : (bit as unknown)}`);
			}
		}

		return bitsResult;
	}
}
