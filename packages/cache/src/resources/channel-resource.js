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
var _ChannelResource_namespace, _ChannelResource_adapter, _ChannelResource_users;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChannelResource = void 0;
const base_resource_1 = require("./base-resource");
const user_resource_1 = require("./user-resource");
/**
 * Resource represented by an channel of discord
 */
class ChannelResource extends base_resource_1.BaseResource {
    constructor(adapter, entity) {
        super('channel', adapter);
        _ChannelResource_namespace.set(this, 'channel');
        _ChannelResource_adapter.set(this, void 0);
        _ChannelResource_users.set(this, void 0);
        __classPrivateFieldSet(this, _ChannelResource_adapter, adapter, "f");
        __classPrivateFieldSet(this, _ChannelResource_users, new user_resource_1.UserResource(adapter), "f");
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
        const kv = await __classPrivateFieldGet(this, _ChannelResource_adapter, "f").get(this.hashId(id));
        if (kv) {
            return new ChannelResource(__classPrivateFieldGet(this, _ChannelResource_adapter, "f"), kv);
        }
        return null;
    }
    /**
     * @inheritDoc
     */
    async set(id, data) {
        if (data.recipients) {
            const recipients = [];
            for (const recipient of data.recipients) {
                recipients.push(__classPrivateFieldGet(this, _ChannelResource_users, "f").set(recipient.id, recipient));
            }
            await Promise.all(recipients);
        }
        delete data.recipients;
        delete data.permission_overwrites;
        await this.addToRelationship(id);
        await __classPrivateFieldGet(this, _ChannelResource_adapter, "f").set(this.hashId(id), data);
    }
    /**
     * @inheritDoc
     */
    async items() {
        const data = await __classPrivateFieldGet(this, _ChannelResource_adapter, "f").items(__classPrivateFieldGet(this, _ChannelResource_namespace, "f"));
        if (data) {
            return data.map(dt => {
                const resource = new ChannelResource(__classPrivateFieldGet(this, _ChannelResource_adapter, "f"), dt);
                resource.setParent(resource.id);
                return resource;
            });
        }
        return [];
    }
    /**
     * @inheritDoc
     */
    async count() {
        return await __classPrivateFieldGet(this, _ChannelResource_adapter, "f").count(__classPrivateFieldGet(this, _ChannelResource_namespace, "f"));
    }
    /**
     * @inheritDoc
     */
    async remove(id) {
        await __classPrivateFieldGet(this, _ChannelResource_adapter, "f").remove(this.hashId(id));
    }
    /**
     * @inheritDoc
     */
    async contains(id) {
        return await __classPrivateFieldGet(this, _ChannelResource_adapter, "f").contains(__classPrivateFieldGet(this, _ChannelResource_namespace, "f"), id);
    }
    /**
     * @inheritDoc
     */
    async getToRelationship() {
        return await __classPrivateFieldGet(this, _ChannelResource_adapter, "f").getToRelationship(__classPrivateFieldGet(this, _ChannelResource_namespace, "f"));
    }
    /**
     * @inheritDoc
     */
    async addToRelationship(id) {
        await __classPrivateFieldGet(this, _ChannelResource_adapter, "f").addToRelationship(__classPrivateFieldGet(this, _ChannelResource_namespace, "f"), id);
    }
    /**
     * @inheritDoc
     */
    async removeToRelationship(id) {
        await __classPrivateFieldGet(this, _ChannelResource_adapter, "f").removeToRelationship(__classPrivateFieldGet(this, _ChannelResource_namespace, "f"), id);
    }
}
exports.ChannelResource = ChannelResource;
_ChannelResource_namespace = new WeakMap(), _ChannelResource_adapter = new WeakMap(), _ChannelResource_users = new WeakMap();
