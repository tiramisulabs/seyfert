import type { Snowflake } from 'discord-api-types/v10';
/**
 * Calculates the default avatar index for a given user id.
 *
 * @param userId - The user id to calculate the default avatar index for
 */
export declare function calculateUserDefaultAvatarIndex(userId: Snowflake, discriminator: string): number;
/**
 * Verifies that a value is a buffer-like object.
 *
 * @param value - The value to check
 */
export declare function isBufferLike(value: unknown): value is ArrayBuffer | Buffer | Uint8Array | Uint8ClampedArray;
