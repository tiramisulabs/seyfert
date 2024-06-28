export type BitFieldResolvable<T extends object> = keyof T | number | bigint | (keyof T | number | bigint)[];
export declare class BitField<T extends object> {
    static None: bigint;
    Flags: Record<string, bigint>;
    private bit;
    constructor(bitfields?: BitFieldResolvable<T>);
    set bits(bits: BitFieldResolvable<T>);
    get bits(): bigint;
    add(...bits: BitFieldResolvable<T>[]): bigint;
    remove(...bits: BitFieldResolvable<T>[]): bigint;
    has(...bits: BitFieldResolvable<T>[]): boolean;
    missings(...bits: BitFieldResolvable<T>[]): bigint[];
    equals(other: BitFieldResolvable<T>): boolean;
    resolve(bits?: BitFieldResolvable<T>): bigint;
    keys(bits?: BitFieldResolvable<T>[]): string[];
    values(bits?: BitFieldResolvable<T>[]): bigint[];
}
