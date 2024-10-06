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

	add(...bits: (BitFieldResolvable<T> | undefined)[]): bigint {
		for (const bit of bits) {
			if (!bit) continue;
			this.bit |= this.resolve(bit);
		}
		return this.bit;
	}

	remove(...bits: BitFieldResolvable<T>[]): bigint {
		for (const bit of bits) {
			this.bit &= ~this.resolve(bit);
		}
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

	resolve(bits: BitFieldResolvable<T>): bigint {
		return BitField.resolve<T>(bits);
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

	static add<T extends object>(base: BitFieldResolvable<T>, ...bits: (BitFieldResolvable<T> | undefined)[]) {
		base = BitField.resolve(base);

		for (const bit of bits) {
			if (!bit) continue;
			base |= BitField.resolve(bit);
		}
		return base;
	}

	static remove<T extends object>(base: BitFieldResolvable<T>, ...bits: BitFieldResolvable<T>[]): bigint {
		base = BitField.resolve(base);

		for (const bit of bits) {
			base &= ~BitField.resolve(bit);
		}
		return base;
	}

	static resolve<T extends object>(bits: BitFieldResolvable<T>): bigint {
		switch (typeof bits) {
			case 'number':
				return BigInt(bits);
			case 'bigint':
				return bits;
			case 'object': {
				if (!Array.isArray(bits)) {
					throw new TypeError(`Cannot resolve permission: ${bits}`);
				}
				return bits.map(x => BitField.resolve(x)).reduce((acc, cur) => acc | cur, BitField.None);
			}
			default:
				throw new TypeError(`Cannot resolve permission: ${typeof bits === 'symbol' ? String(bits) : (bits as any)}`);
		}
	}
}
