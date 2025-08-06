export const DefaultUserAgent = 'DiscordBot (https://seyfert.dev, v3.2.5)';
export const ALLOWED_EXTENSIONS = ['webp', 'png', 'jpg', 'jpeg', 'gif'] as const;
export const ALLOWED_STICKER_EXTENSIONS = ['png', 'json', 'gif'] as const;
export const ALLOWED_SIZES = [16, 32, 64, 100, 128, 256, 512, 1_024, 2_048, 4_096] as const;
export const ALLOWED_SOUNDS_EXTENSIONS = ['mp3', 'ogg'] as const;
export const ALLOWED_TAG_BADGE_EXTENSIONS = ['png', 'jpeg', 'webp'] as const;

export type ImageExtension = (typeof ALLOWED_EXTENSIONS)[number];
export type StickerExtension = (typeof ALLOWED_STICKER_EXTENSIONS)[number];
export type ImageSize = (typeof ALLOWED_SIZES)[number];
export type SoundExtension = (typeof ALLOWED_SOUNDS_EXTENSIONS)[number];
export type TagBadgeExtension = (typeof ALLOWED_TAG_BADGE_EXTENSIONS)[number];
