import { BitwisePermissionFlags } from '@biscuitland/api-types';

export interface BitField<T extends number | bigint> {
    add(...bits: T[]): this;
    remove(...bits: T[]): this;
    has(bit: T): boolean;
    any(bit: T): boolean;
    equals(bit: T): boolean;
}

export type PermissionString = keyof typeof BitwisePermissionFlags;
export type PermissionResolvable =
	| bigint
	| PermissionString
	| PermissionString[]
	| BitwisePermissionFlags
    | BitwisePermissionFlags[];

export class Permissions implements BitField<bigint> {
    /** Stores a reference to BitwisePermissionFlags */
	static Flags = BitwisePermissionFlags;

    /** Falsy; Stores the lack of permissions*/
    static None = 0n;

    /** Stores all entity permissions */
	bitfield: bigint;

    /**
     * Wheter to grant all other permissions to the administrator
     * **Not to get confused with Permissions#admin**
     */
    __admin__ = true;

	constructor(bitfield: PermissionResolvable) {
		this.bitfield = Permissions.resolve(bitfield);
	}

    /** Wheter the bitfield has the administrator flag */
    get admin(): boolean {
        return this.has(Permissions.Flags.ADMINISTRATOR);
    }

    get array(): PermissionString[] {
        // unsafe cast, do not edit
        const permissions = Object.keys(Permissions.Flags) as PermissionString[];
        return permissions.filter(bit => this.has(bit));
    }

    add(...bits: PermissionResolvable[]): this {
        let reduced = 0n;
        for (const bit of bits) {
            reduced |= Permissions.resolve(bit);
        }
        this.bitfield |= reduced;
        return this;
    }

    remove(...bits: PermissionResolvable[]): this {
        let reduced = 0n;
        for (const bit of bits) {
            reduced |= Permissions.resolve(bit);
        }
        this.bitfield &= ~reduced;
        return this;
    }

	has(bit: PermissionResolvable): boolean {
        const bbit = Permissions.resolve(bit);

		if (this.__admin__ && this.bitfield & BigInt(Permissions.Flags.ADMINISTRATOR)) {
			return true;
		}

		return (this.bitfield & bbit) === bbit;
	}

    any(bit: PermissionResolvable): boolean {
        const bbit = Permissions.resolve(bit);

        if (this.__admin__ && this.bitfield & BigInt(Permissions.Flags.ADMINISTRATOR)) {
            return true;
        }

        return (this.bitfield & bbit) !== Permissions.None;
    }

    equals(bit: PermissionResolvable): boolean {
        return !!(this.bitfield & Permissions.resolve(bit));
    }

    /** Gets all permissions */
    static get All(): bigint {
        let reduced = 0n;
        for (const key in BitwisePermissionFlags) {
            const perm = BitwisePermissionFlags[key];

            if (typeof perm === 'number') {
                reduced += perm;
            }
        }
        return reduced;
    }

	static resolve(bit: PermissionResolvable): bigint {
		switch (typeof bit) {
            case 'bigint':
                return bit;
            case 'number':
                return BigInt(bit);
            case 'string':
                return BigInt(Permissions.Flags[bit]);
            case 'object':
                return Permissions.resolve(
                    bit
                        .map(p => typeof p === 'string' ? BigInt(Permissions.Flags[p]) : BigInt(p))
                        .reduce((acc, cur) => acc | cur, Permissions.None)
                );
            default:
                throw new TypeError(`Cannot resolve permission: ${bit}`);
		}
	}

    static sum(permissions: Array<bigint | number>) {
        return permissions.reduce((y, x) => BigInt(y) | BigInt(x), Permissions.None);
    }

    static reduce(permissions: PermissionResolvable[]): Permissions {
        const solved = permissions.map(Permissions.resolve);

        return new Permissions(solved.reduce((y, x) => y | x, Permissions.None));
    }

    *[Symbol.iterator]() {
        yield* this.array;
    }

    valueOf() {
        return this.bitfield;
    }

    toJSON(): { fields: string[] } {
        const fields = Object.keys(Permissions.Flags).filter(bit => typeof bit === 'number' && this.has(bit));

        return { fields };
    }
}
