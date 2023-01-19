"use strict";
/**
 * refactor
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryCacheAdapter = void 0;
const options_1 = require("../../utils/options");
class MemoryCacheAdapter {
    constructor(options) {
        this.relationships = new Map();
        this.storage = new Map();
        this.options = (0, options_1.Options)({}, MemoryCacheAdapter.DEFAULTS, options);
    }
    /**
     * @inheritDoc
     */
    get(id) {
        const data = this.storage.get(id);
        if (data) {
            if (data.expire && data.expire < Date.now()) {
                this.storage.delete(id);
            }
            else {
                return JSON.parse(data.data);
            }
        }
        return null;
    }
    /**
     * @inheritDoc
     */
    set(id, data) {
        const expire = this.options.expire;
        if (expire) {
            this.storage.set(id, {
                data: JSON.stringify(data),
                expire: Date.now() + expire,
            });
        }
        else {
            this.storage.set(id, { data: JSON.stringify(data) });
        }
    }
    /**
     * @inheritDoc
     */
    items(to) {
        const array = [];
        let data = this.getToRelationship(to);
        data = data.map(id => `${to}.${id}`);
        for (const key of data) {
            const content = this.get(key);
            if (content) {
                array.push(content);
            }
        }
        return array;
    }
    /**
     * @inheritDoc
     */
    count(to) {
        return this.getToRelationship(to).length;
    }
    /**
     * @inheritDoc
     */
    remove(id) {
        this.storage.delete(id);
    }
    /**
     * @inheritDoc
     */
    contains(to, id) {
        return this.getToRelationship(to).includes(id);
    }
    /**
     * @inheritDoc
     */
    getToRelationship(to) {
        return this.relationships.get(to) || [];
    }
    /**
     * @inheritDoc
     */
    addToRelationship(to, id) {
        const data = this.getToRelationship(to);
        if (data.includes(id)) {
            return;
        }
        data.push(id);
        const has = !!this.relationships.get(to);
        if (!has) {
            this.relationships.set(to, data);
        }
    }
    /**
     * @inheritDoc
     */
    removeToRelationship(to, id) {
        const data = this.getToRelationship(to);
        if (data) {
            const idx = data.indexOf(id);
            if (idx === -1) {
                return;
            }
            data.splice(idx, 1);
        }
    }
}
exports.MemoryCacheAdapter = MemoryCacheAdapter;
MemoryCacheAdapter.DEFAULTS = {
    expire: 3600000,
};
