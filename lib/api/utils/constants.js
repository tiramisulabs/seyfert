"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OverwrittenMimeTypes = exports.ALLOWED_SIZES = exports.ALLOWED_STICKER_EXTENSIONS = exports.ALLOWED_EXTENSIONS = exports.DefaultUserAgent = void 0;
exports.DefaultUserAgent = 'DiscordBot (https://seyfert.dev)';
exports.ALLOWED_EXTENSIONS = ['webp', 'png', 'jpg', 'jpeg', 'gif'];
exports.ALLOWED_STICKER_EXTENSIONS = ['png', 'json', 'gif'];
exports.ALLOWED_SIZES = [16, 32, 64, 128, 256, 512, 1_024, 2_048, 4_096];
exports.OverwrittenMimeTypes = {
    // https://github.com/discordjs/discord.js/issues/8557
    'image/apng': 'image/png',
};
