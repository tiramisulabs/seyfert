"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GuildPreview = void 0;
const AnonymousGuild_1 = require("./AnonymousGuild");
/**
 * Represent Discord Guild Preview Object
 * @link https://discord.com/developers/docs/resources/guild#guild-preview-object
 */
class GuildPreview extends AnonymousGuild_1.AnonymousGuild {
    constructor(client, data) {
        super(client, data);
    }
}
exports.GuildPreview = GuildPreview;
