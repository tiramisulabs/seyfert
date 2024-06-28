"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryAdapter = void 0;
class MemoryAdapter {
    isAsync = false;
    storage = new Map();
    relationships = new Map();
    scan(query, keys = false) {
        const values = [];
        const sq = query.split('.');
        for (const [key, value] of this.storage.entries()) {
            if (key.split('.').every((value, i) => (sq[i] === '*' ? !!value : sq[i] === value))) {
                values.push(keys ? key : JSON.parse(value));
            }
        }
        return values;
    }
    bulkGet(keys) {
        return keys
            .map(x => {
            const data = this.storage.get(x);
            return data ? JSON.parse(data) : null;
        })
            .filter(x => x);
    }
    get(keys) {
        const data = this.storage.get(keys);
        return data ? JSON.parse(data) : null;
    }
    bulkSet(keys) {
        for (const [key, value] of keys) {
            this.storage.set(key, JSON.stringify(value));
        }
    }
    set(key, data) {
        this.storage.set(key, JSON.stringify(data));
    }
    bulkPatch(updateOnly, keys) {
        for (const [key, value] of keys) {
            const oldData = this.get(key);
            if (updateOnly && !oldData) {
                continue;
            }
            this.storage.set(key, Array.isArray(value) ? JSON.stringify(value) : JSON.stringify({ ...(oldData ?? {}), ...value }));
        }
    }
    patch(updateOnly, keys, data) {
        const oldData = this.get(keys);
        if (updateOnly && !oldData) {
            return;
        }
        this.storage.set(keys, Array.isArray(data) ? JSON.stringify(data) : JSON.stringify({ ...(oldData ?? {}), ...data }));
    }
    values(to) {
        const array = [];
        const data = this.keys(to);
        for (const key of data) {
            const content = this.get(key);
            if (content) {
                array.push(content);
            }
        }
        return array;
    }
    keys(to) {
        return this.getToRelationship(to).map(id => `${to}.${id}`);
    }
    count(to) {
        return this.getToRelationship(to).length;
    }
    bulkRemove(keys) {
        for (const i of keys) {
            this.storage.delete(i);
        }
    }
    remove(key) {
        this.storage.delete(key);
    }
    flush() {
        this.storage.clear();
        this.relationships.clear();
    }
    contains(to, keys) {
        return this.getToRelationship(to).includes(keys);
    }
    getToRelationship(to) {
        return this.relationships.get(to) || [];
    }
    bulkAddToRelationShip(data) {
        for (const i in data) {
            this.addToRelationship(i, data[i]);
        }
    }
    addToRelationship(to, keys) {
        if (!this.relationships.has(to)) {
            this.relationships.set(to, []);
        }
        const data = this.getToRelationship(to);
        for (const key of Array.isArray(keys) ? keys : [keys]) {
            if (!data.includes(key)) {
                data.push(key);
            }
        }
    }
    removeToRelationship(to, keys) {
        const data = this.getToRelationship(to);
        if (data) {
            for (const key of Array.isArray(keys) ? keys : [keys]) {
                const idx = data.indexOf(key);
                if (idx !== -1) {
                    data.splice(idx, 1);
                }
            }
        }
    }
    removeRelationship(to) {
        for (const i of Array.isArray(to) ? to : [to]) {
            this.relationships.delete(i);
        }
    }
}
exports.MemoryAdapter = MemoryAdapter;
