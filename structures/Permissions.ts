import { BitwisePermissionFlags } from "../vendor/external.ts";

export type PermissionString = keyof typeof BitwisePermissionFlags;
export type PermissionResolvable =
    | bigint
    | PermissionString
    | PermissionString[]
    | BitwisePermissionFlags;

export class Permissions {
    static Flags = BitwisePermissionFlags;
    bitfield: bigint;

    constructor(bitfield: PermissionResolvable) {
        this.bitfield = Permissions.resolve(bitfield);
    }

    has(bit: PermissionResolvable) {
        if (this.bitfield & BigInt(Permissions.Flags.ADMINISTRATOR)) {
            return true;
        }

        return !!(this.bitfield & Permissions.resolve(bit));
    }

    static resolve(bit: PermissionResolvable): bigint {
        switch (typeof bit) {
            case "bigint":
                return bit;
            case "number":
                return BigInt(bit);
            case "string":
                return BigInt(Permissions.Flags[bit]);
            case "object":
                return Permissions.resolve(
                    bit.map((p) => BigInt(Permissions.Flags[p])).reduce((acc, cur) => acc | cur, 0n),
                );
            default:
                throw new TypeError(`Cannot resolve permission: ${bit}`);
        }
    }
}

export default Permissions;
