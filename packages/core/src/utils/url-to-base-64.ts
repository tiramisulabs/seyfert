/** Converts a url to base 64. Useful for example, uploading/creating server emojis. */
export async function urlToBase64(url: string): Promise<string> {
    const buffer = await fetch(url).then((res) => res.arrayBuffer());
    const imageStr = encode(buffer);
    const type = url.substring(url.lastIndexOf('.') + 1);
    return `data:image/${type};base64,${imageStr}`;
}

// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
const base64abc: string[] = [
    "A", "B", "C",
    "D", "E", "F",
    "G", "H", "I",
    "J", "K", "L",
    "M", "N", "O",
    "P", "Q", "R",
    "S", "T", "U",
    "V", "W", "X",
    "Y", "Z", "a",
    "b", "c", "d",
    "e", "f", "g",
    "h", "i", "j",
    "k", "l", "m",
    "n", "o", "p",
    "q", "r", "s",
    "t", "u", "v",
    "w", "x", "y",
    "z", "0", "1",
    "2", "3", "4",
    "5", "6", "7",
    "8", "9", "+", "/",
];

/**
 * CREDIT: https://gist.github.com/enepomnyaschih/72c423f727d395eeaa09697058238727
 * Encodes a given Uint8Array, ArrayBuffer or string into RFC4648 base64 representation
 * @param data
 */
export function encode(data: ArrayBuffer | string): string {
    const uint8: Uint8Array = typeof data === 'string'
        ? new TextEncoder().encode(data)
        : data instanceof Uint8Array
        ? data
        : new Uint8Array(data);
    let result = '',
        i;
    const l: number = uint8.length;
    for (i = 2; i < l; i += 3) {
        result += base64abc[uint8[i - 2] >> 2];
        result += base64abc[((uint8[i - 2] & 0x03) << 4) | (uint8[i - 1] >> 4)];
        result += base64abc[((uint8[i - 1] & 0x0f) << 2) | (uint8[i] >> 6)];
        result += base64abc[uint8[i] & 0x3f];
    }
    if (i === l + 1) {
        // 1 octet yet to write
        result += base64abc[uint8[i - 2] >> 2];
        result += base64abc[(uint8[i - 2] & 0x03) << 4];
        result += '==';
    }
    if (i === l) {
        // 2 octets yet to write
        result += base64abc[uint8[i - 2] >> 2];
        result += base64abc[((uint8[i - 2] & 0x03) << 4) | (uint8[i - 1] >> 4)];
        result += base64abc[(uint8[i - 1] & 0x0f) << 2];
        result += '=';
    }
    return result;
}
