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
var _GuildEmojiResource_namespace, _GuildEmojiResource_adapter, _GuildEmojiResource_users;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GuildEmojiResource = void 0;
const base_resource_1 = require("./base-resource");
const user_resource_1 = require("./user-resource");
/**
 * Resource represented by an emoji of discord
 */
class GuildEmojiResource extends base_resource_1.BaseResource {
    constructor(adapter, entity, parent) {
        super('emoji', adapter);
        _GuildEmojiResource_namespace.set(this, 'emoji');
        _GuildEmojiResource_adapter.set(this, void 0);
        _GuildEmojiResource_users.set(this, void 0);
        __classPrivateFieldSet(this, _GuildEmojiResource_adapter, adapter, "f");
        __classPrivateFieldSet(this, _GuildEmojiResource_users, new user_resource_1.UserResource(adapter), "f");
        if (entity) {
            this.setEntity(entity);
        }
        if (parent) {
            this.setParent(parent);
        }
    }
    /**
     * @inheritDoc
     */
    async get(id, guild = this.parent) {
        if (this.parent) {
            return this;
        }
        const kv = await __classPrivateFieldGet(this, _GuildEmojiResource_adapter, "f").get(this.hashGuildId(id, guild));
        if (kv) {
            return new GuildEmojiResource(__classPrivateFieldGet(this, _GuildEmojiResource_adapter, "f"), kv, guild);
        }
        return null;
    }
    /**
     * @inheritDoc
     */
    async set(id, guild = this.parent, data) {
        if (data.user) {
            await __classPrivateFieldGet(this, _GuildEmojiResource_users, "f").set(data.user.id, data.user);
        }
        delete data.user;
        delete data.roles;
        if (this.parent) {
            this.setEntity(data);
        }
        await this.addToRelationship(id, guild);
        await __classPrivateFieldGet(this, _GuildEmojiResource_adapter, "f").set(this.hashGuildId(id, guild), data);
    }
    /**
     * @inheritDoc
     */
    async items(to) {
        if (!to && this.parent) {
            to = this.parent;
        }
        const data = await __classPrivateFieldGet(this, _GuildEmojiResource_adapter, "f").items(this.hashId(to));
        if (data) {
            return data.map(dt => {
                const resource = new GuildEmojiResource(__classPrivateFieldGet(this, _GuildEmojiResource_adapter, "f"), dt);
                resource.setParent(to);
                return resource;
            });
        }
        return [];
    }
    /**
     * @inheritDoc
     */
    async remove(id, guild = this.parent) {
        await this.removeToRelationship(id, guild);
        await __classPrivateFieldGet(this, _GuildEmojiResource_adapter, "f").remove(this.hashGuildId(id, guild));
    }
    /**
     * @inheritDoc
     */
    hashGuildId(id, guild) {
        if (!guild) {
            return this.hashId(id);
        }
        return `${__classPrivateFieldGet(this, _GuildEmojiResource_namespace, "f")}.${guild}.${id}`;
    }
}
exports.GuildEmojiResource = GuildEmojiResource;
_GuildEmojiResource_namespace = new WeakMap(), _GuildEmojiResource_adapter = new WeakMap(), _GuildEmojiResource_users = new WeakMap();
