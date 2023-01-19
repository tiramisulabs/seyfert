"use strict";
/**
 * refactor
 */
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
var _PresenceResource_namespace, _PresenceResource_adapter, _PresenceResource_users;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PresenceResource = void 0;
const base_resource_1 = require("./base-resource");
const user_resource_1 = require("./user-resource");
/**
 * Resource represented by an presence of discord
 */
class PresenceResource extends base_resource_1.BaseResource {
    constructor(adapter, entity) {
        super('presence', adapter);
        _PresenceResource_namespace.set(this, 'presence');
        _PresenceResource_adapter.set(this, void 0);
        _PresenceResource_users.set(this, void 0);
        __classPrivateFieldSet(this, _PresenceResource_adapter, adapter, "f");
        __classPrivateFieldSet(this, _PresenceResource_users, new user_resource_1.UserResource(__classPrivateFieldGet(this, _PresenceResource_adapter, "f")), "f");
        if (entity) {
            this.setEntity(entity);
        }
    }
    /**
     * @inheritDoc
     */
    async get(id) {
        if (this.parent) {
            return this;
        }
        const kv = await __classPrivateFieldGet(this, _PresenceResource_adapter, "f").get(this.hashId(id));
        if (kv) {
            return new PresenceResource(__classPrivateFieldGet(this, _PresenceResource_adapter, "f"), kv);
        }
        return null;
    }
    /**
     * @inheritDoc
     */
    async set(id, data) {
        if (data.user) {
            await __classPrivateFieldGet(this, _PresenceResource_users, "f").set(data.user.id, data.user);
        }
        delete data.user;
        delete data.roles;
        delete data.guild_id;
        if (this.parent) {
            this.setEntity(data);
        }
        await this.addToRelationship(id);
        await __classPrivateFieldGet(this, _PresenceResource_adapter, "f").set(this.hashId(id), data);
    }
    /**
     * @inheritDoc
     */
    async items() {
        const data = await __classPrivateFieldGet(this, _PresenceResource_adapter, "f").items(__classPrivateFieldGet(this, _PresenceResource_namespace, "f"));
        if (data) {
            return data.map(dt => new PresenceResource(__classPrivateFieldGet(this, _PresenceResource_adapter, "f"), dt));
        }
        return [];
    }
    /**
     * @inheritDoc
     */
    async count() {
        return await __classPrivateFieldGet(this, _PresenceResource_adapter, "f").count(__classPrivateFieldGet(this, _PresenceResource_namespace, "f"));
    }
    /**
     * @inheritDoc
     */
    async remove(id) {
        await this.removeToRelationship(id);
        await __classPrivateFieldGet(this, _PresenceResource_adapter, "f").remove(this.hashId(id));
    }
    /**
     * @inheritDoc
     */
    async contains(id) {
        return await __classPrivateFieldGet(this, _PresenceResource_adapter, "f").contains(__classPrivateFieldGet(this, _PresenceResource_namespace, "f"), id);
    }
    /**
     * @inheritDoc
     */
    async getToRelationship() {
        return await __classPrivateFieldGet(this, _PresenceResource_adapter, "f").getToRelationship(__classPrivateFieldGet(this, _PresenceResource_namespace, "f"));
    }
    /**
     * @inheritDoc
     */
    async addToRelationship(id) {
        await __classPrivateFieldGet(this, _PresenceResource_adapter, "f").addToRelationship(__classPrivateFieldGet(this, _PresenceResource_namespace, "f"), id);
    }
    /**
     * @inheritDoc
     */
    async removeToRelationship(id) {
        await __classPrivateFieldGet(this, _PresenceResource_adapter, "f").removeToRelationship(__classPrivateFieldGet(this, _PresenceResource_namespace, "f"), id);
    }
}
exports.PresenceResource = PresenceResource;
_PresenceResource_namespace = new WeakMap(), _PresenceResource_adapter = new WeakMap(), _PresenceResource_users = new WeakMap();
