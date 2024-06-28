"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseResource = void 0;
const common_1 = require("../../../common");
class BaseResource {
    cache;
    client;
    namespace = 'base';
    constructor(cache, client) {
        this.cache = cache;
        if (client) {
            this.client = client;
        }
    }
    /** @internal */
    __setClient(client) {
        this.client = client;
    }
    //@ts-expect-error
    filter(data, id) {
        return true;
    }
    get adapter() {
        return this.cache.adapter;
    }
    removeIfNI(intent, id) {
        if (!this.cache.hasIntent(intent)) {
            return this.remove(id);
        }
        return;
    }
    setIfNI(intent, id, data) {
        if (!this.cache.hasIntent(intent)) {
            return this.set(id, data);
        }
    }
    get(id) {
        return this.adapter.get(this.hashId(id));
    }
    bulk(ids) {
        return (0, common_1.fakePromise)(this.adapter.bulkGet(ids.map(id => this.hashId(id)))).then(x => x.filter(y => y));
    }
    set(id, data) {
        if (!this.filter(data, id))
            return;
        return (0, common_1.fakePromise)(this.addToRelationship(id)).then(() => this.adapter.set(this.hashId(id), data));
    }
    patch(id, data) {
        if (!this.filter(data, id))
            return;
        return (0, common_1.fakePromise)(this.addToRelationship(id)).then(() => this.adapter.patch(false, this.hashId(id), data));
    }
    remove(id) {
        return (0, common_1.fakePromise)(this.removeToRelationship(id)).then(() => this.adapter.remove(this.hashId(id)));
    }
    keys() {
        return this.adapter.keys(this.namespace);
    }
    values() {
        return this.adapter.values(this.namespace);
    }
    count() {
        return this.adapter.count(this.namespace);
    }
    contains(id) {
        return this.adapter.contains(this.namespace, id);
    }
    getToRelationship() {
        return this.adapter.getToRelationship(this.namespace);
    }
    addToRelationship(id) {
        return this.adapter.addToRelationship(this.namespace, id);
    }
    removeToRelationship(id) {
        return this.adapter.removeToRelationship(this.namespace, id);
    }
    hashId(id) {
        return id.startsWith(this.namespace) ? id : `${this.namespace}.${id}`;
    }
}
exports.BaseResource = BaseResource;
