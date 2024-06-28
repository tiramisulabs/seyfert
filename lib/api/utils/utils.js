"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateUserDefaultAvatarIndex = calculateUserDefaultAvatarIndex;
exports.isBufferLike = isBufferLike;
/**
 * Calculates the default avatar index for a given user id.
 *
 * @param userId - The user id to calculate the default avatar index for
 */
function calculateUserDefaultAvatarIndex(userId, discriminator) {
    return discriminator === '0' ? Number(BigInt(userId) >> 22n) % 6 : Number.parseInt(discriminator) % 5;
}
/**
 * Verifies that a value is a buffer-like object.
 *
 * @param value - The value to check
 */
function isBufferLike(value) {
    return value instanceof ArrayBuffer || value instanceof Uint8Array || value instanceof Uint8ClampedArray;
}
