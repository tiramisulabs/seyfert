"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BitField = void 0;
class BitField {
    static None = 0n;
    Flags = {};
    bit;
    constructor(bitfields) {
        this.bit = this.resolve(bitfields);
    }
    set bits(bits) {
        this.bit = this.resolve(bits);
    }
    get bits() {
        return this.bit;
    }
    add(...bits) {
        let reduced = BitField.None;
        for (const bit of bits) {
            reduced |= this.resolve(bit);
        }
        return (this.bit |= reduced);
    }
    remove(...bits) {
        let reduced = BitField.None;
        for (const bit of bits) {
            reduced |= this.resolve(bit);
        }
        return (this.bit &= ~reduced);
    }
    has(...bits) {
        const bitsResolved = bits.map(bit => this.resolve(bit));
        return bitsResolved.every(bit => (this.bits & bit) === bit);
    }
    missings(...bits) {
        const bitsResolved = bits.map(bit => this.resolve(bit));
        return bitsResolved.filter(bit => (this.bits & bit) !== bit);
    }
    equals(other) {
        return this.bits === this.resolve(other);
    }
    resolve(bits) {
        switch (typeof bits) {
            case 'number':
                return BigInt(bits);
            case 'string':
                return this.resolve(this.Flags[bits]);
            case 'bigint':
                return bits;
            case 'object':
                if (!Array.isArray(bits)) {
                    throw new TypeError(`Cannot resolve permission: ${bits}`);
                }
                return bits.map(x => this.resolve(x)).reduce((acc, cur) => acc | cur, BitField.None);
            default:
                throw new TypeError(`Cannot resolve permission: ${typeof bits === 'symbol' ? String(bits) : bits}`);
        }
    }
    keys(bits = [this.bits]) {
        const bitsResolved = bits.map(bit => BigInt(this.resolve(bit)));
        return Object.entries(this.Flags).reduce((acc, value) => {
            if (bitsResolved.some(bit => (bit & value[1]) === value[1])) {
                acc.push(value[0]);
                return acc;
            }
            return acc;
        }, []);
    }
    values(bits = [this.bits]) {
        const bitsResolved = bits.map(bit => BigInt(this.resolve(bit)));
        return Object.entries(this.Flags).reduce((acc, value) => {
            if (bitsResolved.some(bit => (bit & value[1]) === value[1])) {
                acc.push(value[1]);
                return acc;
            }
            return acc;
        }, []);
    }
}
exports.BitField = BitField;
