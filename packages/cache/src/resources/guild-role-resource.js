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
var _GuildRoleResource_namespace, _GuildRoleResource_adapter;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GuildRoleResource = void 0;
const base_resource_1 = require("./base-resource");
/**
 * Resource represented by an role of discord
 */
class GuildRoleResource extends base_resource_1.BaseResource {
    constructor(adapter, entity, parent) {
        super('role', adapter);
        _GuildRoleResource_namespace.set(this, 'role');
        _GuildRoleResource_adapter.set(this, void 0);
        __classPrivateFieldSet(this, _GuildRoleResource_adapter, adapter, "f");
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
        const kv = await __classPrivateFieldGet(this, _GuildRoleResource_adapter, "f").get(this.hashGuildId(id, guild));
        if (kv) {
            return new GuildRoleResource(__classPrivateFieldGet(this, _GuildRoleResource_adapter, "f"), kv, guild);
        }
        return null;
    }
    /**
     * @inheritDoc
     */
    async set(id, guild = this.parent, data) {
        if (!data.id) {
            data.id = id;
        }
        if (!data.guild_id) {
            data.guild_id = guild;
        }
        if (this.parent) {
            this.setEntity(data);
        }
        await this.addToRelationship(id, guild);
        await __classPrivateFieldGet(this, _GuildRoleResource_adapter, "f").set(this.hashGuildId(id, guild), data);
    }
    /**
     * @inheritDoc
     */
    async count() {
        return await __classPrivateFieldGet(this, _GuildRoleResource_adapter, "f").count(__classPrivateFieldGet(this, _GuildRoleResource_namespace, "f"));
    }
    /**
     * @inheritDoc
     */
    async items(to) {
        if (!to && this.parent) {
            to = this.parent;
        }
        const data = await __classPrivateFieldGet(this, _GuildRoleResource_adapter, "f").items(this.hashId(to));
        if (data) {
            return data.map(dt => {
                const resource = new GuildRoleResource(__classPrivateFieldGet(this, _GuildRoleResource_adapter, "f"), dt);
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
        await __classPrivateFieldGet(this, _GuildRoleResource_adapter, "f").remove(this.hashGuildId(id, guild));
    }
    /**
     * @inheritDoc
     */
    hashGuildId(id, guild) {
        if (!guild) {
            return this.hashId(id);
        }
        return `${__classPrivateFieldGet(this, _GuildRoleResource_namespace, "f")}.${guild}.${id}`;
    }
}
exports.GuildRoleResource = GuildRoleResource;
_GuildRoleResource_namespace = new WeakMap(), _GuildRoleResource_adapter = new WeakMap();
