export declare const DefaultUserAgent = "DiscordBot (https://seyfert.dev)";
export declare const ALLOWED_EXTENSIONS: readonly ["webp", "png", "jpg", "jpeg", "gif"];
export declare const ALLOWED_STICKER_EXTENSIONS: readonly ["png", "json", "gif"];
export declare const ALLOWED_SIZES: readonly [16, 32, 64, 128, 256, 512, 1024, 2048, 4096];
export type ImageExtension = (typeof ALLOWED_EXTENSIONS)[number];
export type StickerExtension = (typeof ALLOWED_STICKER_EXTENSIONS)[number];
export type ImageSize = (typeof ALLOWED_SIZES)[number];
export declare const OverwrittenMimeTypes: {
    readonly 'image/apng': "image/png";
};
