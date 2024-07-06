import type { Snowflake } from 'discord-api-types/v10';

/**
 * Calculates the default avatar index for a given user id.
 *
 * @param userId - The user id to calculate the default avatar index for
 */
export function calculateUserDefaultAvatarIndex(userId: Snowflake, discriminator: string) {
	return discriminator === '0' ? Number(BigInt(userId) >> 22n) % 6 : Number.parseInt(discriminator) % 5;
}

/**
 * Verifies that a value is a buffer-like object.
 *
 * @param value - The value to check
 */
export function isBufferLike(value: unknown): value is ArrayBuffer | Buffer | Uint8Array | Uint8ClampedArray {
	return value instanceof ArrayBuffer || value instanceof Uint8Array || value instanceof Uint8ClampedArray;
}
