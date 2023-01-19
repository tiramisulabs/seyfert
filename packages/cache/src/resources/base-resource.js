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
var _Base_namespace, _Base_adapter;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseResource = void 0;
/**
 * Base class for all resources
 * All Methods from BaseResource are also available on every class extends
 */
class Base {
    /**
     * Constructor
     */
    constructor(namespace, adapter) {
        /**
         * Resource name
         */
        _Base_namespace.set(this, 'base');
        /**
         * Adapter for storage processes and operations
         */
        _Base_adapter.set(this, void 0);
        __classPrivateFieldSet(this, _Base_namespace, namespace, "f");
        __classPrivateFieldSet(this, _Base_adapter, adapter, "f");
    }
    /**
     * Entity linked
     */
    setEntity(entity) {
        Object.assign(this, entity);
    }
    /**
     * Parent linked
     */
    setParent(parent) {
        // rename
        this.parent = parent;
    }
    /**
     * Count how many resources there are in the relationships
     */
    async count(to) {
        return await __classPrivateFieldGet(this, _Base_adapter, "f").count(this.hashId(to));
    }
    /**
     * Check if the resource is in the relationships
     */
    async contains(id, guild = this.parent) {
        return await __classPrivateFieldGet(this, _Base_adapter, "f").contains(this.hashId(guild), id);
    }
    /**
     * Gets the resource relationships
     */
    async getToRelationship(id = this.parent) {
        return await __classPrivateFieldGet(this, _Base_adapter, "f").getToRelationship(this.hashId(id));
    }
    /**
     * Adds the resource to relationships
     */
    async addToRelationship(id, guild = this.parent) {
        await __classPrivateFieldGet(this, _Base_adapter, "f").addToRelationship(this.hashId(guild), id);
    }
    /**
     * Removes the relationship resource
     */
    async removeToRelationship(id, guild = this.parent) {
        await __classPrivateFieldGet(this, _Base_adapter, "f").removeToRelationship(this.hashId(guild), id);
    }
    /**
     * Construct an id consisting of namespace.id
     */
    hashId(id) {
        return `${__classPrivateFieldGet(this, _Base_namespace, "f")}.${id}`;
    }
}
_Base_namespace = new WeakMap(), _Base_adapter = new WeakMap();
exports.BaseResource = Base;
