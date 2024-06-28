"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const api_1 = require("../api");
const common_1 = require("../common");
const DiscordBase_1 = require("./extra/DiscordBase");
class User extends DiscordBase_1.DiscordBase {
    get tag() {
        return this.globalName ?? `${this.username}#${this.discriminator}`;
    }
    get name() {
        return this.globalName ?? this.username;
    }
    /**
     * Fetch user
     */
    fetch(force = false) {
        return this.client.users.fetch(this.id, force);
    }
    /**
     * Open a DM with the user
     */
    dm(force = false) {
        return this.client.users.createDM(this.id, force);
    }
    write(body) {
        return this.client.users.write(this.id, body);
    }
    defaultAvatarURL() {
        return this.rest.cdn.embed.avatars.get((0, api_1.calculateUserDefaultAvatarIndex)(this.id, this.discriminator));
    }
    avatarURL(options) {
        if (!this.avatar) {
            return this.defaultAvatarURL();
        }
        return this.rest.cdn.avatars(this.id).get(this.avatar, options);
    }
    avatarDecorationURL(options) {
        if (!this.avatarDecoration)
            return;
        return this.rest.cdn['avatar-decorations'](this.id).get(this.avatarDecoration, options);
    }
    bannerURL(options) {
        if (!this.banner)
            return;
        return this.rest.cdn.banners(this.id).get(this.banner, options);
    }
    presence() {
        return this.client.members.presence(this.id);
    }
    toString() {
        return common_1.Formatter.userMention(this.id);
    }
}
exports.User = User;
