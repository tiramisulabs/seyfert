/**
 * Memory optimizations
 * All credits to the Discordeno authors
 */

export function iconHashToBigInt(hash: string) {
    return BigInt("0x" + (hash.startsWith("a_") ? `a${hash.substring(2)}` : `b${hash}`));
}

export function iconBigintToHash(icon: bigint) {
    const hash = icon.toString(16);

    return hash.startsWith("a") ? `a_${hash.substring(1)}` : hash.substring(1);
}
