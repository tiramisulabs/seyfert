import type { ImageFormat } from 'discord-api-types/v10';

export type EditNickname = { nick?: string; reason?: string };

/**
 * @link https://discord.com/developers/docs/reference#image-formatting
 */
export type ImageSize = 16 | 32 | 64 | 128 | 256 | 512 | 1024 | 2048 | 4096;

export type ImageOptions = {
	format?: ImageFormat;
	size?: ImageSize;
};
