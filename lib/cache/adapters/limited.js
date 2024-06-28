"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LimitedMemoryAdapter = void 0;
const __1 = require("../..");
const common_1 = require("../../common");
class LimitedMemoryAdapter {
    isAsync = false;
    storage = new Map();
    relationships = new Map();
    options;
    constructor(options) {
        this.options = (0, common_1.MergeOptions)({
            default: {
                expire: undefined,
                limit: Number.POSITIVE_INFINITY,
            },
        }, options);
    }
    scan(query, keys = false) {
        const values = [];
        const sq = query.split('.');
        for (const iterator of [...this.storage.values()].flatMap(x => x.entries()))
            for (const [key, value] of iterator) {
                if (key.split('.').every((value, i) => (sq[i] === '*' ? !!value : sq[i] === value))) {
                    values.push(keys ? key : JSON.parse(value.value));
                }
            }
        return values;
    }
    bulkGet(keys) {
        const iterator = [...this.storage.values()];
        return keys
            .map(key => {
            const data = iterator.find(x => x.has(key))?.get(key);
            return data ? JSON.parse(data) : null;
        })
            .filter(x => x);
    }
    get(keys) {
        const data = [...this.storage.values()].find(x => x.has(keys))?.get(keys);
        return data ? JSON.parse(data) : null;
    }
    __set(key, data) {
        const __guildId = Array.isArray(data) ? data[0].guild_id : data.guild_id;
        const namespace = `${key.split('.')[0]}${__guildId ? `.${__guildId}` : ''}`;
        const self = this;
        if (!this.storage.has(namespace)) {
            this.storage.set(namespace, new __1.LimitedCollection({
                expire: this.options[key.split('.')[0]]?.expire ?? this.options.default.expire,
                limit: this.options[key.split('.')[0]]?.limit ?? this.options.default.limit,
                resetOnDemand: true,
                onDelete(k) {
                    const relationshipNamespace = key.split('.')[0];
                    const relation = self.relationships.get(relationshipNamespace);
                    if (relation) {
                        switch (relationshipNamespace) {
                            case 'guild':
                            case 'user':
                                self.removeToRelationship(namespace, k.split('.')[1]);
                                break;
                            case 'ban':
                            case 'member':
                            case 'voice_state':
                                {
                                    const split = k.split('.');
                                    self.removeToRelationship(`${namespace}.${split[1]}`, split[2]);
                                }
                                break;
                            case 'channel':
                            case 'emoji':
                            case 'presence':
                            case 'role':
                            case 'stage_instance':
                            case 'sticker':
                            case 'thread':
                            case 'overwrite':
                            case 'message':
                                self.removeToRelationship(namespace, k.split('.')[1]);
                                break;
                        }
                    }
                },
            }));
        }
        this.storage.get(namespace).set(key, JSON.stringify(data));
    }
    bulkSet(keys) {
        for (const [key, value] of keys) {
            this.__set(key, value);
        }
    }
    set(keys, data) {
        this.__set(keys, data);
    }
    bulkPatch(updateOnly, keys) {
        for (const [key, value] of keys) {
            const oldData = this.get(key);
            if (updateOnly && !oldData) {
                continue;
            }
            this.__set(key, Array.isArray(value) ? value : { ...(oldData ?? {}), ...value });
        }
    }
    patch(updateOnly, keys, data) {
        const oldData = this.get(keys);
        if (updateOnly && !oldData) {
            return;
        }
        this.__set(keys, Array.isArray(data) ? data : { ...(oldData ?? {}), ...data });
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
            this.storage.get(i.split('.')[0])?.delete(i);
        }
    }
    remove(key) {
        this.storage.get(key.split('.')[0])?.delete(key);
    }
    flush() {
        this.storage.clear();
        this.relationships.clear();
    }
    contains(to, keys) {
        return this.getToRelationship(to).includes(keys);
    }
    getToRelationship(to) {
        const key = to.split('.')[0];
        if (!this.relationships.has(key))
            this.relationships.set(key, new Map());
        const relation = this.relationships.get(key);
        const subrelationKey = to.split('.')[1] ?? '*';
        if (!relation.has(subrelationKey)) {
            relation.set(subrelationKey, []);
        }
        return relation.get(subrelationKey);
    }
    bulkAddToRelationShip(data) {
        for (const i in data) {
            this.addToRelationship(i, data[i]);
        }
    }
    addToRelationship(to, keys) {
        const key = to.split('.')[0];
        if (!this.relationships.has(key)) {
            this.relationships.set(key, new Map());
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
exports.LimitedMemoryAdapter = LimitedMemoryAdapter;
