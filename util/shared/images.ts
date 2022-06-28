/**
 * @link https://discord.com/developers/docs/reference#image-formatting
 */
export type ImageFormat = "jpg" | "jpeg" | "png" | "webp" | "gif" | "json";

/**
 * @link https://discord.com/developers/docs/reference#image-formatting
 */
export type ImageSize = 16 | 32 | 64 | 128 | 256 | 512 | 1024 | 2048 | 4096;

/** Help format an image url */
export function formatImageUrl(url: string, size: ImageSize = 128, format?: ImageFormat) {
    return `${url}.${format || (url.includes("/a_") ? "gif" : "jpg")}?size=${size}`;
}
