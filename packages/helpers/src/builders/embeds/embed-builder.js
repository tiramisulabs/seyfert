"use strict";
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _EmbedBuilder_data;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmbedBuilder = void 0;
class EmbedBuilder {
    constructor(data = {}) {
        _EmbedBuilder_data.set(this, void 0);
        __classPrivateFieldSet(this, _EmbedBuilder_data, data, "f");
        if (!__classPrivateFieldGet(this, _EmbedBuilder_data, "f").fields) {
            __classPrivateFieldGet(this, _EmbedBuilder_data, "f").fields = [];
        }
    }
    setAuthor(author) {
        __classPrivateFieldGet(this, _EmbedBuilder_data, "f").author = author;
        return this;
    }
    setColor(color) {
        __classPrivateFieldGet(this, _EmbedBuilder_data, "f").color = color;
        return this;
    }
    setDescription(description) {
        __classPrivateFieldGet(this, _EmbedBuilder_data, "f").description = description;
        return this;
    }
    addField(field) {
        __classPrivateFieldGet(this, _EmbedBuilder_data, "f").fields.push(field);
        return this;
    }
    setFooter(footer) {
        __classPrivateFieldGet(this, _EmbedBuilder_data, "f").footer = footer;
        return this;
    }
    setImage(image) {
        __classPrivateFieldGet(this, _EmbedBuilder_data, "f").image = { url: image };
        return this;
    }
    setProvider(provider) {
        __classPrivateFieldGet(this, _EmbedBuilder_data, "f").provider = provider;
        return this;
    }
    setThumbnail(thumbnail) {
        __classPrivateFieldGet(this, _EmbedBuilder_data, "f").thumbnail = { url: thumbnail };
        return this;
    }
    setTimestamp(timestamp) {
        __classPrivateFieldGet(this, _EmbedBuilder_data, "f").timestamp = timestamp instanceof Date ? timestamp.toISOString() : timestamp;
        return this;
    }
    setTitle(title, url) {
        __classPrivateFieldGet(this, _EmbedBuilder_data, "f").title = title;
        if (url) {
            this.setUrl(url);
        }
        return this;
    }
    setUrl(url) {
        __classPrivateFieldGet(this, _EmbedBuilder_data, "f").url = url;
        return this;
    }
    setVideo(video) {
        __classPrivateFieldGet(this, _EmbedBuilder_data, "f").video = video;
        return this;
    }
    toJSON() {
        return __classPrivateFieldGet(this, _EmbedBuilder_data, "f");
    }
}
exports.EmbedBuilder = EmbedBuilder;
_EmbedBuilder_data = new WeakMap();
